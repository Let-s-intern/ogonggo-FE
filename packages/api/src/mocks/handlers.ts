import { http, HttpResponse, type HttpHandler } from 'msw';
import { BOOTCAMP_FIXTURES } from './fixtures/bootcamp';
import { JOB_FIXTURES } from './fixtures/job';
import { GetJobsSort } from '../generated/user/models/getJobsSort';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import type { PageInfo } from '../generated/user/models/pageInfo';
import type { SuccessResponsePageResponseUserBootcampSummaryResponse } from '../generated/user/models/successResponsePageResponseUserBootcampSummaryResponse';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '../generated/user/models/successResponsePageResponseUserJobSummaryResponse';
import type { SuccessResponseUserBootcampDetailResponse } from '../generated/user/models/successResponseUserBootcampDetailResponse';
import type { SuccessResponseUserJobDetailResponse } from '../generated/user/models/successResponseUserJobDetailResponse';
import type { UserBootcampDetailResponse } from '../generated/user/models/userBootcampDetailResponse';
import type { UserBootcampSummaryResponse } from '../generated/user/models/userBootcampSummaryResponse';
import type { UserJobDetailResponse } from '../generated/user/models/userJobDetailResponse';
import type { UserJobSummaryResponse } from '../generated/user/models/userJobSummaryResponse';

/**
 * `pnpm codegen` (orval, mock: true) writes a `getGetJobsMockHandler`/`getGetJobMockHandler`
 * pair next to each generated client, under src/generated/<client>/endpoints.ts. Those call
 * faker directly on every request and always answer 200 (see the "관련 파일" note in the Push 1
 * task file for why that can't drive real sort/pagination/404 checks) — the jobs handlers below
 * are written by hand against the fixed fixtures in ./fixtures/job.ts instead. The bootcamp
 * list handler below follows the same shape against ./fixtures/bootcamp.ts. Bookmark and auth
 * endpoints stay unhandled: this feature does not call them.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 10;
/** 부트캠프 목록 한 페이지 건수. 목업은 10건이지만 결정 전까지 12로 둔다(Push 1 task 선행 조건). */
const DEFAULT_BOOTCAMP_SIZE = 12;

const toSummary = ({
  companyAndTeamIntroduction: _companyAndTeamIntroduction,
  responsibilities: _responsibilities,
  qualifications: _qualifications,
  preferredQualifications: _preferredQualifications,
  compensation: _compensation,
  benefits: _benefits,
  hiringProcess: _hiringProcess,
  sourceUrl: _sourceUrl,
  ...summary
}: UserJobDetailResponse): UserJobSummaryResponse => summary;

/** LATEST는 id 역순(생성 역순 근사), VIEW_COUNT는 조회수 내림차순이며 동률이면 최신순(id 역순). */
const sortJobs = (jobs: UserJobDetailResponse[], sort: string): UserJobDetailResponse[] =>
  [...jobs].sort((a, b) =>
    sort === GetJobsSort.VIEW_COUNT ? b.viewCount - a.viewCount || b.id - a.id : b.id - a.id,
  );

/**
 * `q`/`employmentType`/`experienceType`는 실제 백엔드 `GET /api/v1/jobs`에는 없는 파라미터다
 * (PRD 10절) — MSW 위에서만 의미가 있고, 실제 API로 전환할 때 이 필터는 다시 손을 대야 한다.
 * `q`는 제목+회사명 부분 일치(대소문자 무시)다.
 */
const filterJobs = (
  jobs: UserJobDetailResponse[],
  { q, employmentType, experienceType }: { q?: string; employmentType?: string; experienceType?: string },
): UserJobDetailResponse[] =>
  jobs.filter((job) => {
    if (q) {
      const needle = q.toLowerCase();
      const haystack = `${job.title} ${job.companyName}`.toLowerCase();
      if (!haystack.includes(needle)) {
        return false;
      }
    }
    if (employmentType && job.employmentType !== employmentType) {
      return false;
    }
    if (experienceType && job.experienceType !== experienceType) {
      return false;
    }
    return true;
  });

const getJobsHandler = http.get('*/api/v1/jobs', ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? DEFAULT_PAGE);
  const size = Number(url.searchParams.get('size') ?? DEFAULT_SIZE);
  const sort = url.searchParams.get('sort') ?? GetJobsSort.LATEST;
  const q = url.searchParams.get('q') ?? undefined;
  const employmentType = url.searchParams.get('employmentType') ?? undefined;
  const experienceType = url.searchParams.get('experienceType') ?? undefined;

  const filtered = filterJobs(JOB_FIXTURES, { q, employmentType, experienceType });
  const sorted = sortJobs(filtered, sort);
  const start = (page - 1) * size;
  const items = sorted.slice(start, start + size).map(toSummary);

  const pageInfo: PageInfo = {
    pageNum: page,
    pageSize: size,
    totalElements: sorted.length,
    totalPages: Math.ceil(sorted.length / size),
  };

  const body: SuccessResponsePageResponseUserJobSummaryResponse = {
    status: 200,
    message: '채용공고 목록을 조회했습니다.',
    data: { items, pageInfo },
  };

  return HttpResponse.json(body, { status: 200 });
});

const getJobHandler = http.get('*/api/v1/jobs/:jobId', ({ params }) => {
  const jobId = Number(params.jobId);
  const job = JOB_FIXTURES.find((fixture) => fixture.id === jobId);

  if (!job) {
    const body: ErrorResponse = {
      status: 404,
      code: 'JOB_NOT_FOUND',
      message: `채용공고를 찾을 수 없습니다: ${String(params.jobId)}`,
    };
    return HttpResponse.json(body, { status: 404 });
  }

  const body: SuccessResponseUserJobDetailResponse = {
    status: 200,
    message: '채용공고 상세를 조회했습니다.',
    data: job,
  };

  return HttpResponse.json(body, { status: 200 });
});

const toBootcampSummary = ({
  content: _content,
  eligibilityAndSelectionProcess: _eligibilityAndSelectionProcess,
  applicationMethod: _applicationMethod,
  applicationUrl: _applicationUrl,
  managerEmail: _managerEmail,
  inquiryUrl: _inquiryUrl,
  publicationStartAt: _publicationStartAt,
  publicationEndAt: _publicationEndAt,
  sourceUrl: _sourceUrl,
  partners: _partners,
  curriculums: _curriculums,
  ...summary
}: UserBootcampDetailResponse): UserBootcampSummaryResponse => summary;

/**
 * API 없음: `GET /api/v1/bootcamps`의 생성 타입 `GetBootcampsParams`에는 `page`와 `size`뿐이다
 * (`packages/api/src/generated/user/models/getBootcampsParams.ts`). 목업의 탭 네 개
 * (`전체`/`부트캠프`/`국비지원`/`무료특강`)와 `모집 중만` 토글에 대응하는 파라미터가 없어
 * `programType`/`tuitionType`/`status`를 MSW에서만 처리한다.
 *
 * 실제 API로 전환할 때 손대야 하는 지점이다. Spring은 모르는 쿼리 파라미터를 400이 아니라
 * 무시로 처리하므로, 이 주석이 없으면 탭이 조용히 안 먹는 상태를 아무도 눈치채지 못한다
 * (PRD 2절).
 *
 * 탭 매핑은 PRD 4.1 표 그대로다 — `부트캠프`만 `programType`이고 `국비지원`·`무료특강`은
 * `tuitionType`이다. 한 파라미터로 묶이지 않아 둘 다 받는다.
 */
const filterBootcamps = (
  bootcamps: UserBootcampDetailResponse[],
  { programType, tuitionType, status }: { programType?: string; tuitionType?: string; status?: string },
): UserBootcampDetailResponse[] =>
  bootcamps.filter((bootcamp) => {
    if (programType && bootcamp.programType !== programType) {
      return false;
    }
    if (tuitionType && bootcamp.tuitionType !== tuitionType) {
      return false;
    }
    if (status && bootcamp.status !== status) {
      return false;
    }
    return true;
  });

/**
 * API 없음: `getBootcamps`에는 `sort` 파라미터가 없다(PRD 2절 표). 목업 우측의 `최신순`
 * 드롭다운을 위해 MSW에서만 정렬한다 — 채용공고와 같은 기준으로 LATEST는 id 역순, VIEW_COUNT는
 * 조회수 내림차순이며 동률이면 id 역순이다.
 */
const sortBootcamps = (
  bootcamps: UserBootcampDetailResponse[],
  sort: string,
): UserBootcampDetailResponse[] =>
  [...bootcamps].sort((a, b) =>
    sort === GetJobsSort.VIEW_COUNT ? b.viewCount - a.viewCount || b.id - a.id : b.id - a.id,
  );

const getBootcampsHandler = http.get('*/api/v1/bootcamps', ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? DEFAULT_PAGE);
  const size = Number(url.searchParams.get('size') ?? DEFAULT_BOOTCAMP_SIZE);
  const sort = url.searchParams.get('sort') ?? GetJobsSort.LATEST;
  const programType = url.searchParams.get('programType') ?? undefined;
  const tuitionType = url.searchParams.get('tuitionType') ?? undefined;
  const status = url.searchParams.get('status') ?? undefined;

  const filtered = filterBootcamps(BOOTCAMP_FIXTURES, { programType, tuitionType, status });
  const sorted = sortBootcamps(filtered, sort);
  const start = (page - 1) * size;
  const items = sorted.slice(start, start + size).map(toBootcampSummary);

  const pageInfo: PageInfo = {
    pageNum: page,
    pageSize: size,
    totalElements: sorted.length,
    totalPages: Math.ceil(sorted.length / size),
  };

  const body: SuccessResponsePageResponseUserBootcampSummaryResponse = {
    status: 200,
    message: '부트캠프 목록을 조회했습니다.',
    data: { items, pageInfo },
  };

  return HttpResponse.json(body, { status: 200 });
});

/**
 * `getBootcamp1`(공개 상세, `GET /api/v1/bootcamps/{bootcampId}`)에 대응한다. 기업 회원용
 * `getBootcamp`(`/api/v1/users/me/bootcamps/{id}`)는 이 화면이 쓰지 않으므로 핸들러도 없다.
 * 404 본문은 `getJobHandler`와 같은 `ErrorResponse` 모양이다.
 */
const getBootcampHandler = http.get('*/api/v1/bootcamps/:bootcampId', ({ params }) => {
  const bootcampId = Number(params.bootcampId);
  const bootcamp = BOOTCAMP_FIXTURES.find((fixture) => fixture.id === bootcampId);

  if (!bootcamp) {
    const body: ErrorResponse = {
      status: 404,
      code: 'BOOTCAMP_NOT_FOUND',
      message: `부트캠프를 찾을 수 없습니다: ${String(params.bootcampId)}`,
    };
    return HttpResponse.json(body, { status: 404 });
  }

  const body: SuccessResponseUserBootcampDetailResponse = {
    status: 200,
    message: '부트캠프 상세를 조회했습니다.',
    data: bootcamp,
  };

  return HttpResponse.json(body, { status: 200 });
});

export const handlers: HttpHandler[] = [
  getJobsHandler,
  getJobHandler,
  getBootcampsHandler,
  getBootcampHandler,
];
