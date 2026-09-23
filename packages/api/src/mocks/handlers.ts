import { http, HttpResponse, type HttpHandler } from 'msw';
import { BOOTCAMP_FIXTURES } from './fixtures/bootcamp';
import { JOB_FIXTURES } from './fixtures/job';
import {
  RECRUITMENT_POST_FIXTURES,
  type RecruitmentPostFixture,
} from './fixtures/recruitment-post';
import { USER_NOTICE_FIXTURES } from './fixtures/user-notice';
import { GetRecruitmentPostsPositionsItem } from '../generated/user/models/getRecruitmentPostsPositionsItem';
import { GetRecruitmentPostsProgressMethodsItem } from '../generated/user/models/getRecruitmentPostsProgressMethodsItem';
import { GetRecruitmentPostsRecruitmentStatusesItem } from '../generated/user/models/getRecruitmentPostsRecruitmentStatusesItem';
import { GetRecruitmentPostsRecruitmentTypesItem } from '../generated/user/models/getRecruitmentPostsRecruitmentTypesItem';
import { GetRecruitmentPostsSort } from '../generated/user/models/getRecruitmentPostsSort';
import { ListPublicJobsSort } from '../generated/user/models/listPublicJobsSort';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import type { PageInfo } from '../generated/user/models/pageInfo';
import type { RecruitmentPostDetailResponse } from '../generated/user/models/recruitmentPostDetailResponse';
import type { RecruitmentPostSummaryResponse } from '../generated/user/models/recruitmentPostSummaryResponse';
import type { SuccessResponsePageResponseRecruitmentPostSummaryResponse } from '../generated/user/models/successResponsePageResponseRecruitmentPostSummaryResponse';
import type { SuccessResponseRecruitmentPostDetailResponse } from '../generated/user/models/successResponseRecruitmentPostDetailResponse';
import type { SuccessResponsePageResponseUserBootcampSummaryResponse } from '../generated/user/models/successResponsePageResponseUserBootcampSummaryResponse';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '../generated/user/models/successResponsePageResponseUserJobSummaryResponse';
import type { SuccessResponsePageResponseUserNoticeSummaryResponse } from '../generated/user/models/successResponsePageResponseUserNoticeSummaryResponse';
import type { SuccessResponseUserNoticeDetailResponse } from '../generated/user/models/successResponseUserNoticeDetailResponse';
import type { UserNoticeSummaryResponse } from '../generated/user/models/userNoticeSummaryResponse';
import type { SuccessResponseListUserJobCalendarItemResponse } from '../generated/user/models/successResponseListUserJobCalendarItemResponse';
import type { SuccessResponseUserBootcampDetailResponse } from '../generated/user/models/successResponseUserBootcampDetailResponse';
import type { SuccessResponseUserJobDetailResponse } from '../generated/user/models/successResponseUserJobDetailResponse';
import type { UserBootcampDetailResponse } from '../generated/user/models/userBootcampDetailResponse';
import type { UserBootcampSummaryResponse } from '../generated/user/models/userBootcampSummaryResponse';
import type { UserJobCalendarItemResponse } from '../generated/user/models/userJobCalendarItemResponse';
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
    sort === ListPublicJobsSort.VIEW_COUNT ? b.viewCount - a.viewCount || b.id - a.id : b.id - a.id,
  );

/**
 * `q`/`employmentType`/`experienceType`는 실제 백엔드 `GET /api/v1/jobs`에는 없는 파라미터다
 * (PRD 10절). 백엔드가 뒤늦게 같은 필터를 구현했으나 검색 파라미터 이름이 `q`가 아니라
 * `keyword`라 아직 이름이 어긋난다 — 실제 API로 전환할 때 여기와 `JobList`를 함께 고친다.
 * `q`는 제목+회사명 부분 일치(대소문자 무시)다.
 */
const filterJobs = (
  jobs: UserJobDetailResponse[],
  {
    q,
    employmentType,
    experienceType,
  }: { q?: string; employmentType?: string; experienceType?: string },
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
  const sort = url.searchParams.get('sort') ?? ListPublicJobsSort.LATEST;
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

/** 달력 조회 최대 기간(일). ogonggo-BE `UserJobController.MAX_CALENDAR_RANGE_DAYS`와 같은 값이다. */
const MAX_CALENDAR_RANGE_DAYS = 92;

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` 하루의 UTC 자정 epoch. 날짜 문자열만 다뤄 실행 시간대의 영향을 받지 않는다. */
const toCalendarDay = (value: string): number => Date.parse(`${value}T00:00:00Z`);

/**
 * ogonggo-BE `UserApiExceptionHandler`가 `InvalidRequestParameterException`을 400으로 바꿀 때
 * 만드는 본문과 같은 모양이다 — 코드는 `BAD_REQUEST`이고 메시지는 `[파라미터명] 사유`다.
 * (PRD 4절이 부르는 `INVALID_REQUEST_PARAMETER`는 예외 이름이고, 응답 `code`는 아니다.)
 */
const calendarBadRequest = (parameterName: string, reason: string) => {
  const body: ErrorResponse = {
    status: 400,
    code: 'BAD_REQUEST',
    message: `[${parameterName}] ${reason}`,
  };
  return HttpResponse.json(body, { status: 400 });
};

/**
 * `GET /api/v1/jobs/calendar`. `getJobHandler`의 경로 패턴이 `/api/v1/jobs/:jobId`라 이 경로도
 * 삼키므로 `handlers` 배열에서 반드시 그보다 앞에 있어야 한다 — MSW는 먼저 맞는 핸들러를 쓴다.
 *
 * 응답은 `UserJobCalendarItemResponse` 네 필드뿐이다(PRD 2절). 제목도 로고 URL도 없어서
 * 달력 화면은 `companyName`으로 로고를 찾는다.
 *
 * 담는 기준은 **`recruitmentEndAt`이 `from`~`to`에 드는 공고**다(Push 1 task 1.1). 실제 BE의
 * `findPublishedCalendarJobs`는 모집 기간이 조회 범위와 겹치기만 하면 담는 질의라 실 API로
 * 바꾸면 여기서 안 오던 공고(범위 밖에서 마감하는 공고)가 더 온다 — 화면은 마감일 칸에만
 * 그리므로 그때도 격자에 나타나지는 않지만, 주간 뷰 막대 색 규칙(PRD 8.3, "이번 주 마감")과는
 * 어긋나므로 그 시점에 한 번 정해야 한다.
 *
 * 마감일이 없는 상시채용은 BE 질의의 `recruitmentEndAt is not null`과 같게 제외한다.
 * `recruitmentStartAt`은 응답 타입이 필수인데 실데이터 픽스처 대부분이 비어 있어 없으면
 * 마감일로 채운다 — 하루짜리 일정이 된다.
 *
 * 2026-09-23 스펙 동기화(`2de3c3a`)로 응답에 `title`·`employmentType`·`experienceType`·
 * `bookmarked` 가 필수로 붙었다. 넷 다 `JOB_FIXTURES`(`UserJobDetailResponse`) 에 같은 이름으로
 * 있어 그대로 옮긴다. `coverImageUrl` 은 선택이라 값이 있을 때만 싣는다. `jobField`·`jobRole` 은
 * 선택이고 픽스처에 없어 싣지 않는다.
 */
const getJobCalendarHandler = http.get('*/api/v1/jobs/calendar', ({ request }) => {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';

  if (!CALENDAR_DATE_PATTERN.test(from)) {
    return calendarBadRequest('from', '조회 시작일은 YYYY-MM-DD 형식이어야 합니다.');
  }
  if (!CALENDAR_DATE_PATTERN.test(to)) {
    return calendarBadRequest('to', '조회 종료일은 YYYY-MM-DD 형식이어야 합니다.');
  }
  if (from > to) {
    return calendarBadRequest('from', '조회 시작일은 종료일보다 늦을 수 없습니다.');
  }

  const days = (toCalendarDay(to) - toCalendarDay(from)) / 86_400_000 + 1;
  if (days > MAX_CALENDAR_RANGE_DAYS) {
    return calendarBadRequest(
      'to',
      `조회 기간은 최대 ${MAX_CALENDAR_RANGE_DAYS}일까지 가능합니다.`,
    );
  }

  const items: UserJobCalendarItemResponse[] = JOB_FIXTURES.filter((job) => {
    const endDay = job.recruitmentEndAt?.slice(0, 10);
    return endDay !== undefined && endDay >= from && endDay <= to;
  })
    // BE 질의의 `order by job.recruitmentEndAt asc, job.id asc`와 같은 순서다.
    .sort(
      (a, b) => (a.recruitmentEndAt ?? '').localeCompare(b.recruitmentEndAt ?? '') || a.id - b.id,
    )
    .map((job) => ({
      id: job.id,
      companyName: job.companyName,
      title: job.title,
      ...(job.coverImageUrl ? { coverImageUrl: job.coverImageUrl } : {}),
      employmentType: job.employmentType,
      experienceType: job.experienceType,
      recruitmentStartAt: job.recruitmentStartAt ?? (job.recruitmentEndAt as string),
      recruitmentEndAt: job.recruitmentEndAt as string,
      bookmarked: job.bookmarked,
    }));

  const body: SuccessResponseListUserJobCalendarItemResponse = {
    status: 200,
    message: '채용공고 달력을 조회했습니다.',
    data: items,
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
 * `GET /api/v1/bootcamps`의 생성 타입은 `ListPublicBootcampsParams`이고
 * (`packages/api/src/generated/user/models/listPublicBootcampsParams.ts`) `page`/`size`/`sort`/
 * `tuitionType`/`status`/`keyword`를 가진다. 목업의 탭 네 개
 * (`전체`/`부트캠프`/`국비지원`/`무료특강`) 중 `programType`만 대응하는 파라미터가 없어
 * MSW에서만 처리한다.
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
  {
    programType,
    tuitionType,
    status,
  }: { programType?: string; tuitionType?: string; status?: string },
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
 * `listPublicBootcamps`의 `sort`에 대응한다(2026-09-10 스펙 동기화로 생겼다). 목업 우측의
 * `최신순` 드롭다운을 위한 것으로 — 채용공고와 같은 기준으로 LATEST는 id 역순, VIEW_COUNT는
 * 조회수 내림차순이며 동률이면 id 역순이다.
 */
const sortBootcamps = (
  bootcamps: UserBootcampDetailResponse[],
  sort: string,
): UserBootcampDetailResponse[] =>
  [...bootcamps].sort((a, b) =>
    sort === ListPublicJobsSort.VIEW_COUNT ? b.viewCount - a.viewCount || b.id - a.id : b.id - a.id,
  );

const getBootcampsHandler = http.get('*/api/v1/bootcamps', ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? DEFAULT_PAGE);
  const size = Number(url.searchParams.get('size') ?? DEFAULT_BOOTCAMP_SIZE);
  const sort = url.searchParams.get('sort') ?? ListPublicJobsSort.LATEST;
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
 * `getPublicBootcamp`(공개 상세, `GET /api/v1/bootcamps/{bootcampId}`)에 대응한다. 기업 회원용
 * `getMyBootcamp`(`/api/v1/users/me/bootcamps/{id}`)는 이 화면이 쓰지 않으므로 핸들러도 없다.
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

/** `getRecruitmentPosts` 의 기본 한 페이지 건수. ogonggo-BE 기본값과 같다. 화면은 `size=8` 을 보낸다. */
const DEFAULT_RECRUITMENT_POST_SIZE = 10;
const MAX_RECRUITMENT_POST_SIZE = 100;

/**
 * ogonggo-BE 가 잘못된 파라미터에 주는 400 본문과 같은 모양(`[파라미터명] 사유`) 이다. 범위
 * 위반의 사유 문구는 백엔드와 같다. 형 변환 실패는 백엔드가 Spring 의 긴 변환 메시지를 그대로
 * 싣는데, 목은 값만 적은 짧은 문구로 대신한다 — 화면은 상태 코드만 본다.
 */
const recruitmentPostBadRequest = (message: string) => {
  const body: ErrorResponse = { status: 400, code: 'BAD_REQUEST', message };
  return HttpResponse.json(body, { status: 400 });
};

const INTEGER_PATTERN = /^-?\d+$/;

/**
 * 목록 필터 네 개와 각각 받는 값. 모두 반복 쿼리(`recruitmentTypes=STUDY&recruitmentTypes=SIDE_PROJECT`)
 * 로 온다 — 생성 클라이언트 `getGetRecruitmentPostsUrl` 이 배열을 이렇게 펼쳐 보낸다.
 */
const RECRUITMENT_POST_FILTERS = {
  recruitmentTypes: GetRecruitmentPostsRecruitmentTypesItem,
  progressMethods: GetRecruitmentPostsProgressMethodsItem,
  recruitmentStatuses: GetRecruitmentPostsRecruitmentStatusesItem,
  positions: GetRecruitmentPostsPositionsItem,
} as const;

type RecruitmentPostFilterName = keyof typeof RECRUITMENT_POST_FILTERS;

/** ogonggo-BE `RecruitmentPostQueryRepository` 의 정렬과 같다. 동률은 모두 id 역순이다. */
const sortRecruitmentPosts = (
  posts: RecruitmentPostFixture[],
  sort: string,
): RecruitmentPostFixture[] =>
  [...posts].sort((a, b) => {
    switch (sort) {
      case GetRecruitmentPostsSort.DEADLINE:
        return a.recruitmentEndDate.localeCompare(b.recruitmentEndDate) || b.id - a.id;
      case GetRecruitmentPostsSort.VIEW_COUNT:
        return b.viewCount - a.viewCount || b.id - a.id;
      case GetRecruitmentPostsSort.COMMENT_COUNT:
        return b.commentCount - a.commentCount || b.id - a.id;
      default:
        return b.id - a.id;
    }
  });

const toRecruitmentPostSummary = ({
  id,
  author,
  title,
  recruitmentType,
  progressMethod,
  recruitmentStatus,
  capacity,
  activityDurationMonths,
  technologyStacks,
  recruitmentStartDate,
  recruitmentEndDate,
  viewCount,
  commentCount,
  applicationCount,
  bookmarkCount,
  bookmarked,
}: RecruitmentPostFixture): RecruitmentPostSummaryResponse => ({
  id,
  author,
  title,
  recruitmentType,
  progressMethod,
  recruitmentStatus,
  capacity,
  activityDurationMonths,
  technologyStacks,
  recruitmentStartDate,
  recruitmentEndDate,
  viewCount,
  commentCount,
  applicationCount,
  bookmarkCount,
  bookmarked,
});

const toRecruitmentPostDetail = ({
  applicationCount: _applicationCount,
  ...detail
}: RecruitmentPostFixture): RecruitmentPostDetailResponse => detail;

/**
 * `getRecruitmentPosts`(`GET /api/v1/recruitment-posts`). 필터 네 개는 각각 반복 쿼리이고, 한
 * 필터 안의 값은 OR, 필터끼리는 AND 다. `positions` 는 글의 포지션 중 하나라도 겹치면 담는다
 * (백엔드 `positions.any().in(...)`). `page`·`size` 범위와 enum 밖의 값은 백엔드처럼 400 이다.
 */
const getRecruitmentPostsHandler = http.get('*/api/v1/recruitment-posts', ({ request }) => {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page') ?? String(DEFAULT_PAGE);
  const sizeParam = searchParams.get('size') ?? String(DEFAULT_RECRUITMENT_POST_SIZE);

  if (!INTEGER_PATTERN.test(pageParam)) {
    return recruitmentPostBadRequest(`[page] 정수가 아닙니다: ${pageParam}`);
  }
  if (!INTEGER_PATTERN.test(sizeParam)) {
    return recruitmentPostBadRequest(`[size] 정수가 아닙니다: ${sizeParam}`);
  }
  const page = Number(pageParam);
  const size = Number(sizeParam);
  if (page < 1) {
    return recruitmentPostBadRequest('[page] must be greater than or equal to 1');
  }
  if (size < 1) {
    return recruitmentPostBadRequest('[size] must be greater than or equal to 1');
  }
  if (size > MAX_RECRUITMENT_POST_SIZE) {
    return recruitmentPostBadRequest(
      `[size] must be less than or equal to ${MAX_RECRUITMENT_POST_SIZE}`,
    );
  }

  const sort = searchParams.get('sort') ?? GetRecruitmentPostsSort.LATEST;
  if (!(Object.values(GetRecruitmentPostsSort) as string[]).includes(sort)) {
    return recruitmentPostBadRequest(`[sort] 허용하지 않는 값입니다: ${sort}`);
  }

  const selected = {} as Record<RecruitmentPostFilterName, string[]>;
  for (const name of Object.keys(RECRUITMENT_POST_FILTERS) as RecruitmentPostFilterName[]) {
    const allowed: string[] = Object.values(RECRUITMENT_POST_FILTERS[name]);
    const values = searchParams.getAll(name);
    const invalid = values.find((value) => !allowed.includes(value));
    if (invalid !== undefined) {
      return recruitmentPostBadRequest(`[${name}] 허용하지 않는 값입니다: ${invalid}`);
    }
    selected[name] = values;
  }
  const accepts = (name: RecruitmentPostFilterName, values: string[]) =>
    selected[name].length === 0 || values.some((value) => selected[name].includes(value));

  const filtered = RECRUITMENT_POST_FIXTURES.filter(
    (post) =>
      accepts('recruitmentTypes', [post.recruitmentType]) &&
      accepts('progressMethods', [post.progressMethod]) &&
      accepts('recruitmentStatuses', [post.recruitmentStatus]) &&
      accepts('positions', post.positions),
  );
  const sorted = sortRecruitmentPosts(filtered, sort);
  const start = (page - 1) * size;
  const items = sorted.slice(start, start + size).map(toRecruitmentPostSummary);

  const body: SuccessResponsePageResponseRecruitmentPostSummaryResponse = {
    status: 200,
    message: '요청이 성공했습니다.',
    data: {
      items,
      pageInfo: {
        pageNum: page,
        pageSize: size,
        totalElements: sorted.length,
        totalPages: Math.ceil(sorted.length / size),
      },
    },
  };

  return HttpResponse.json(body, { status: 200 });
});

/**
 * `getPublicRecruitmentPost`(`GET /api/v1/recruitment-posts/{postId}`). 백엔드와 같이 숫자가
 * 아니거나 1 미만인 id 는 400, 없는 id 는 404 `RECRUITMENT_POST_NOT_FOUND` 다. 본문 문구도
 * 백엔드 응답에서 옮겼다.
 */
const getRecruitmentPostHandler = http.get('*/api/v1/recruitment-posts/:postId', ({ params }) => {
  const rawPostId = String(params.postId);
  if (!INTEGER_PATTERN.test(rawPostId)) {
    return recruitmentPostBadRequest('잘못된 요청입니다.');
  }
  const postId = Number(rawPostId);
  if (postId < 1) {
    return recruitmentPostBadRequest('[getRecruitmentPost.postId] must be greater than 0');
  }

  const post = RECRUITMENT_POST_FIXTURES.find((fixture) => fixture.id === postId);
  if (!post) {
    const body: ErrorResponse = {
      status: 404,
      code: 'RECRUITMENT_POST_NOT_FOUND',
      message: '모집글을 찾을 수 없습니다.',
    };
    return HttpResponse.json(body, { status: 404 });
  }

  const body: SuccessResponseRecruitmentPostDetailResponse = {
    status: 200,
    message: '요청이 성공했습니다.',
    data: toRecruitmentPostDetail(post),
  };

  return HttpResponse.json(body, { status: 200 });
});

/** 공지 목록 한 페이지 건수. 백엔드 기본값이자 `widgets/notice-list` 가 보내는 값이다. */
const DEFAULT_NOTICE_SIZE = 10;

const toNoticeSummary = ({
  content: _content,
  ...summary
}: (typeof USER_NOTICE_FIXTURES)[number]): UserNoticeSummaryResponse => summary;

/**
 * `listPublicNotices`(`GET /api/v1/notices`). 픽스처가 이미 백엔드 정렬 순서(고정 먼저, 그 안에서
 * id 역순) 로 놓여 있어 여기서 다시 정렬하지 않는다 — 화면도 받은 순서를 그대로 그린다.
 */
const getNoticesHandler = http.get('*/api/v1/notices', ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? DEFAULT_PAGE);
  const size = Number(url.searchParams.get('size') ?? DEFAULT_NOTICE_SIZE);

  const start = (page - 1) * size;
  const items = USER_NOTICE_FIXTURES.slice(start, start + size).map(toNoticeSummary);

  const body: SuccessResponsePageResponseUserNoticeSummaryResponse = {
    status: 200,
    message: '요청이 성공했습니다.',
    data: {
      items,
      pageInfo: {
        pageNum: page,
        pageSize: size,
        totalElements: USER_NOTICE_FIXTURES.length,
        totalPages: Math.ceil(USER_NOTICE_FIXTURES.length / size),
      },
    },
  };

  return HttpResponse.json(body, { status: 200 });
});

/**
 * `getPublicNotice`(`GET /api/v1/notices/{noticeId}`). 404 본문은 운영 응답을 그대로 옮긴 것이다
 * (2026-09-23 확인: `{"status":404,"code":"NOTICE_NOT_FOUND","message":"공지사항을 찾을 수 없습니다."}`).
 */
const getNoticeHandler = http.get('*/api/v1/notices/:noticeId', ({ params }) => {
  const noticeId = Number(params.noticeId);
  const notice = USER_NOTICE_FIXTURES.find((fixture) => fixture.id === noticeId);

  if (!notice) {
    const body: ErrorResponse = {
      status: 404,
      code: 'NOTICE_NOT_FOUND',
      message: '공지사항을 찾을 수 없습니다.',
    };
    return HttpResponse.json(body, { status: 404 });
  }

  const body: SuccessResponseUserNoticeDetailResponse = {
    status: 200,
    message: '요청이 성공했습니다.',
    data: notice,
  };

  return HttpResponse.json(body, { status: 200 });
});

export const handlers: HttpHandler[] = [
  getJobsHandler,
  // `getJobHandler`보다 앞이어야 한다 — `*/api/v1/jobs/:jobId`가 `/jobs/calendar`도 잡는다.
  getJobCalendarHandler,
  getJobHandler,
  getBootcampsHandler,
  getBootcampHandler,
  getRecruitmentPostsHandler,
  getRecruitmentPostHandler,
  getNoticesHandler,
  getNoticeHandler,
];
