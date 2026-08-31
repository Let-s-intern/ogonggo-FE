import { http, HttpResponse, type HttpHandler } from 'msw';
import { JOB_FIXTURES } from './fixtures/job';
import { GetJobsSort } from '../generated/user/models/getJobsSort';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import type { PageInfo } from '../generated/user/models/pageInfo';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '../generated/user/models/successResponsePageResponseUserJobSummaryResponse';
import type { SuccessResponseUserJobDetailResponse } from '../generated/user/models/successResponseUserJobDetailResponse';
import type { UserJobDetailResponse } from '../generated/user/models/userJobDetailResponse';
import type { UserJobSummaryResponse } from '../generated/user/models/userJobSummaryResponse';

/**
 * `pnpm codegen` (orval, mock: true) writes a `getGetJobsMockHandler`/`getGetJobMockHandler`
 * pair next to each generated client, under src/generated/<client>/endpoints.ts. Those call
 * faker directly on every request and always answer 200 (see the "관련 파일" note in the Push 1
 * task file for why that can't drive real sort/pagination/404 checks) — the jobs handlers below
 * are written by hand against the fixed fixtures in ./fixtures/job.ts instead. Bootcamp,
 * bookmark and auth endpoints stay unhandled: this feature does not call them.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 10;

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

export const handlers: HttpHandler[] = [getJobsHandler, getJobHandler];
