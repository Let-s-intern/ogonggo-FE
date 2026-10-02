import { http, HttpResponse, type HttpHandler } from 'msw';
import { BOOTCAMP_FIXTURES } from './fixtures/bootcamp';
import { JOB_FIXTURES } from './fixtures/job';
import { REAL_JOB_SEEDS } from './fixtures/real-jobs-seed';
import {
  RECRUITMENT_POST_FIXTURES,
  type RecruitmentPostFixture,
} from './fixtures/recruitment-post';
import {
  MOCK_VIEWER_NICKNAME,
  MOCK_VIEWER_USER_ID,
  RECRUITMENT_POST_COMMENT_FIXTURES,
  minutesAgo,
  type RecruitmentPostCommentFixture,
} from './fixtures/recruitment-post-comment';
import { USER_NOTICE_FIXTURES } from './fixtures/user-notice';
import { GetRecruitmentPostsPositionsItem } from '../generated/user/models/getRecruitmentPostsPositionsItem';
import { GetRecruitmentPostsProgressMethodsItem } from '../generated/user/models/getRecruitmentPostsProgressMethodsItem';
import { GetRecruitmentPostsRecruitmentStatusesItem } from '../generated/user/models/getRecruitmentPostsRecruitmentStatusesItem';
import { GetRecruitmentPostsRecruitmentTypesItem } from '../generated/user/models/getRecruitmentPostsRecruitmentTypesItem';
import { GetRecruitmentPostsSort } from '../generated/user/models/getRecruitmentPostsSort';
import { ListPublicBootcampsCategory } from '../generated/user/models/listPublicBootcampsCategory';
import { ListPublicJobsSort } from '../generated/user/models/listPublicJobsSort';
import type { CreateRecruitmentPostCommentRequest } from '../generated/user/models/createRecruitmentPostCommentRequest';
import type { CreateServiceFeedbackRequest } from '../generated/user/models/createServiceFeedbackRequest';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import type { PageInfo } from '../generated/user/models/pageInfo';
import type { RecruitmentPostCommentResponse } from '../generated/user/models/recruitmentPostCommentResponse';
import type { RecruitmentPostCommentRootResponse } from '../generated/user/models/recruitmentPostCommentRootResponse';
import type { RecruitmentPostDetailResponse } from '../generated/user/models/recruitmentPostDetailResponse';
import type { RecruitmentPostSummaryResponse } from '../generated/user/models/recruitmentPostSummaryResponse';
import type { SuccessResponseCreateRecruitmentPostCommentResponse } from '../generated/user/models/successResponseCreateRecruitmentPostCommentResponse';
import type { SuccessResponsePageResponseRecruitmentPostCommentResponse } from '../generated/user/models/successResponsePageResponseRecruitmentPostCommentResponse';
import type { SuccessResponsePageResponseRecruitmentPostCommentRootResponse } from '../generated/user/models/successResponsePageResponseRecruitmentPostCommentRootResponse';
import type { SuccessResponsePageResponseRecruitmentPostSummaryResponse } from '../generated/user/models/successResponsePageResponseRecruitmentPostSummaryResponse';
import type { SuccessResponseRecruitmentPostDetailResponse } from '../generated/user/models/successResponseRecruitmentPostDetailResponse';
import type { SuccessResponsePageResponseUserBootcampSummaryResponse } from '../generated/user/models/successResponsePageResponseUserBootcampSummaryResponse';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '../generated/user/models/successResponsePageResponseUserJobSummaryResponse';
import type { SuccessResponseImageUploadResponse } from '../generated/user/models/successResponseImageUploadResponse';
import type { SuccessResponsePageResponseUserNoticeSummaryResponse } from '../generated/user/models/successResponsePageResponseUserNoticeSummaryResponse';
import type { SuccessResponseUserNoticeDetailResponse } from '../generated/user/models/successResponseUserNoticeDetailResponse';
import type { UserNoticeSummaryResponse } from '../generated/user/models/userNoticeSummaryResponse';
import type { SuccessResponseListUserJobCalendarItemResponse } from '../generated/user/models/successResponseListUserJobCalendarItemResponse';
import type { SuccessResponseUserBootcampDetailResponse } from '../generated/user/models/successResponseUserBootcampDetailResponse';
import type { SuccessResponseUserJobDetailResponse } from '../generated/user/models/successResponseUserJobDetailResponse';
import type { UserBootcampDetailResponse } from '../generated/user/models/userBootcampDetailResponse';
import type { UserBootcampSummaryResponse } from '../generated/user/models/userBootcampSummaryResponse';
import type { UserJobCalendarItemResponse } from '../generated/user/models/userJobCalendarItemResponse';
import type { UserJobCalendarItemResponseJobField } from '../generated/user/models/userJobCalendarItemResponseJobField';
import type { UserJobDetailResponse } from '../generated/user/models/userJobDetailResponse';
import type { UserJobSummaryResponse } from '../generated/user/models/userJobSummaryResponse';

/**
 * `pnpm codegen` (orval, mock: true) writes a `getGetJobsMockHandler`/`getGetJobMockHandler`
 * pair next to each generated client, under src/generated/<client>/endpoints.ts. Those call
 * faker directly on every request and always answer 200 (see the "관련 파일" note in the Push 1
 * task file for why that can't drive real sort/pagination/404 checks) — the jobs handlers below
 * are written by hand against the fixed fixtures in ./fixtures/job.ts instead. The bootcamp
 * list handler below follows the same shape against ./fixtures/bootcamp.ts. Bookmark and auth
 * endpoints stay unhandled: this feature does not call them. The recruitment-post comment
 * handlers keep an in-memory store over ./fixtures/recruitment-post-comment.ts so writes and
 * deletes show up until the server restarts.
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
 * 실제 백엔드 `GET /api/v1/jobs` 와 같은 이름의 파라미터를 거른다. `keyword`는 제목+회사명 부분
 * 일치(대소문자 무시)다.
 *
 * `jobField` 는 픽스처의 직군(`JOB_FIELD_BY_FIXTURE_ID`)으로 거른다. `jobRole` 은 거르지 않는다 —
 * 픽스처에 직무가 없어서, 거르면 무엇을 골라도 0건이 된다.
 */
const filterJobs = (
  jobs: UserJobDetailResponse[],
  {
    keyword,
    employmentType,
    experienceType,
    jobField,
  }: { keyword?: string; employmentType?: string; experienceType?: string; jobField?: string },
): UserJobDetailResponse[] =>
  jobs.filter((job) => {
    if (keyword) {
      const needle = keyword.toLowerCase();
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
    if (jobField && JOB_FIELD_BY_FIXTURE_ID.get(job.id) !== jobField) {
      return false;
    }
    return true;
  });

const getJobsHandler = http.get('*/api/v1/jobs', ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? DEFAULT_PAGE);
  const size = Number(url.searchParams.get('size') ?? DEFAULT_SIZE);
  const sort = url.searchParams.get('sort') ?? ListPublicJobsSort.LATEST;
  const keyword = url.searchParams.get('keyword') ?? undefined;
  const employmentType = url.searchParams.get('employmentType') ?? undefined;
  const experienceType = url.searchParams.get('experienceType') ?? undefined;
  const jobField = url.searchParams.get('jobField') ?? undefined;

  const filtered = filterJobs(JOB_FIXTURES, { keyword, employmentType, experienceType, jobField });
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

/**
 * 직군 라벨 → enum. 실데이터 시드의 `job_major` 는 라벨이고, 백엔드는 직군을 enum 으로 주고
 * 받는다(ogonggo-BE LC-3385). 라벨은 `GET /api/v1/enums` 의 `JobField` 설명 그대로다.
 */
const JOB_FIELD_BY_LABEL: Record<string, UserJobCalendarItemResponseJobField> = {
  IT·개발: 'IT_DEVELOPMENT',
  AI·데이터: 'AI_DATA',
  게임: 'GAME',
  디자인: 'DESIGN',
  기획·전략: 'PLANNING_STRATEGY',
  마케팅·광고: 'MARKETING_ADVERTISING',
  상품기획·MD: 'MERCHANDISING',
  영업: 'SALES',
  무역·물류: 'TRADE_LOGISTICS',
  운송·배송: 'TRANSPORT_DELIVERY',
  법률·법무: 'LEGAL',
  HR·총무: 'HR_GENERAL_AFFAIRS',
  회계·세무·재무: 'ACCOUNTING_TAX_FINANCE',
  증권·운용: 'SECURITIES_ASSET_MANAGEMENT',
  은행·카드·보험: 'BANKING_CARD_INSURANCE',
  '엔지니어링·R&D': 'ENGINEERING_RND',
  건설·건축: 'CONSTRUCTION_ARCHITECTURE',
  생산·기능직: 'PRODUCTION_SKILLED_TRADES',
  의료·보건: 'MEDICAL_HEALTH',
  공공·복지: 'PUBLIC_WELFARE',
  교육: 'EDUCATION',
  미디어·엔터: 'MEDIA_ENTERTAINMENT',
  고객상담·TM: 'CUSTOMER_SERVICE_TM',
  서비스: 'SERVICE',
  식음료: 'FOOD_BEVERAGE',
};

/**
 * 픽스처 공고의 직군(`jobField`). 실데이터 시드의 `job_major` 를 위 표로 enum 으로 옮긴다. 시드의
 * 라벨은 배포 서버의 직군 라벨과 **글자까지 같은 집합**이다(2026-09-23 배포 응답 대조: `영업`·
 * `건설·건축`·`엔지니어링·R&D` 등 열 값 모두 관심 직무 25개 이름과 일치).
 *
 * `entities/job/model/job-major.ts` 가 같은 시드를 같은 방식으로 읽는다. 그쪽은 카드 메타 줄에
 * 쓰고 여기는 달력 응답의 칸을 채운다.
 */
const JOB_FIELD_BY_FIXTURE_ID = new Map<number, UserJobCalendarItemResponseJobField>(
  REAL_JOB_SEEDS.flatMap((seed) => {
    const field = seed.jobMajor ? JOB_FIELD_BY_LABEL[seed.jobMajor] : undefined;
    return field ? [[seed.fixtureId, field] as const] : [];
  }),
);

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
 * 응답 칸은 실 API 를 따른다 — 2026-09-23 스펙에서 제목·대표 이미지·고용형태·경력·직군·
 * 북마크 여부가 붙었다. 직군은 위 표에서 채우고, 시드에 값이 없는 공고는 비운다(실서버도
 * `jobField` 가 `null` 인 공고가 있다).
 *
 * `jobField`·`employmentType`·`experienceType`·`excludeClosed`·`keyword`를 거른다(Push 1
 * task 4.1). `bookmarkedOnly`는 화면이 보내지 않아(서버 컴포넌트가 로그인 상태를 모른다,
 * `widgets/job-calendar/lib/query.ts`) 받아도 무시한다.
 *
 * `deadlineOnly`도 받아서 거를 값이 따로 없다 — **이 핸들러는 항상 `recruitmentEndAt`이
 * `from`~`to`에 드는 공고만 담아서**(Push 1 task 1.1), `deadlineOnly=true`를 보내나 안 보내나
 * 결과가 같다. Push 1 task 2.1 에서 화면이 이 파라미터를 **항상 켜기로** 정했다
 * (`widgets/job-calendar/ui/JobCalendarView.tsx`) — 실제 BE의 `findPublishedCalendarJobs`는
 * 모집 기간이 조회 범위와 겹치기만 하면 담는 질의라, 그 파라미터가 없으면 범위 밖에서 마감하는
 * 공고까지 올 수 있다. 이 목은 처음부터 마감일 기준으로만 담아 왔으니 그 결정과 이미 맞다.
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

  const jobField = url.searchParams.get('jobField');
  const employmentType = url.searchParams.get('employmentType');
  const experienceType = url.searchParams.get('experienceType');
  const excludeClosed = url.searchParams.get('excludeClosed') === 'true';
  const keyword = url.searchParams.get('keyword')?.trim().toLowerCase() || undefined;

  const items: UserJobCalendarItemResponse[] = JOB_FIXTURES.filter((job) => {
    const endDay = job.recruitmentEndAt?.slice(0, 10);
    const inRange = endDay !== undefined && endDay >= from && endDay <= to;
    if (!inRange) {
      return false;
    }
    if (jobField !== null && JOB_FIELD_BY_FIXTURE_ID.get(job.id) !== jobField) {
      return false;
    }
    if (employmentType && job.employmentType !== employmentType) {
      return false;
    }
    if (experienceType && job.experienceType !== experienceType) {
      return false;
    }
    // 픽스처는 전부 `closedAt`이 없어(`fixtures/job.ts`) 이 조건이 실제로 무언가를 빼는 날은
    // 없다 — 실서버도 마찬가지였다(Push 1 task 1.2.V, 실데이터 35건이 전부 미래 마감). 그래도
    // 파라미터를 무시하지 않고 실서버와 같은 조건(`closedAt`이 찍혔는가)을 그대로 둔다.
    if (excludeClosed && job.closedAt) {
      return false;
    }
    if (keyword) {
      const haystack = `${job.title} ${job.companyName}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }
    return true;
  })
    // BE 질의의 `order by job.recruitmentEndAt asc, job.id asc`와 같은 순서다.
    .sort(
      (a, b) => (a.recruitmentEndAt ?? '').localeCompare(b.recruitmentEndAt ?? '') || a.id - b.id,
    )
    .map((job) => ({
      id: job.id,
      companyName: job.companyName,
      title: job.title,
      coverImageUrl: job.coverImageUrl,
      employmentType: job.employmentType,
      experienceType: job.experienceType,
      jobField: JOB_FIELD_BY_FIXTURE_ID.get(job.id),
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
 * `listPublicBootcamps`의 `category`를 백엔드와 같은 기준으로 거른다. 백엔드는 분류를 저장하지 않고
 * 등록 경로로 가른다(`ogonggo-BE` 의 `BootcampCategory`) — `KDT`는 고용24의 K-디지털 트레이닝
 * 과정, `SESAC`은 크롤러가 등록한 과정이다.
 *
 * 픽스처에는 등록 경로가 없어 대신 쓰는 값으로 가른다. `SESAC`은 원문이 새싹 사이트인 과정,
 * `KDT`는 프로그램 유형이 `K-디지털 트레이닝`인 과정이다. 지금 픽스처는 전부 새싹 과정이라
 * 목업에서는 `KDT`가 비어 있다.
 *
 * `keyword`는 백엔드처럼 운영 회사명이나 프로그램명에 들어 있는지를 대소문자 없이 본다.
 */
const KDT_PROGRAM_TYPE = 'K-디지털 트레이닝';

const filterBootcamps = (
  bootcamps: UserBootcampDetailResponse[],
  category: string | undefined,
  keyword: string | undefined,
): UserBootcampDetailResponse[] =>
  bootcamps.filter((bootcamp) => {
    if (
      keyword &&
      ![bootcamp.companyName, bootcamp.title].some((text) =>
        text.toLowerCase().includes(keyword.toLowerCase()),
      )
    ) {
      return false;
    }
    if (category === ListPublicBootcampsCategory.KDT) {
      return bootcamp.programType === KDT_PROGRAM_TYPE;
    }
    if (category === ListPublicBootcampsCategory.SESAC) {
      return bootcamp.sourceUrl ? new URL(bootcamp.sourceUrl).hostname === 'sesac.seoul.kr' : false;
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
  const category = url.searchParams.get('category') ?? undefined;
  const keyword = url.searchParams.get('keyword') ?? undefined;

  const filtered = filterBootcamps(BOOTCAMP_FIXTURES, category, keyword);
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

/**
 * 목록 항목. `positions` 는 백엔드가 목록 응답에 더하는 중이라(LC-3434) 생성 타입에 아직 없어
 * 덧붙여 둔다. codegen 뒤 생성 타입에 생기면 이 덧붙임을 지운다.
 */
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
  positions,
  recruitmentStartDate,
  recruitmentEndDate,
  viewCount,
  commentCount,
  applicationCount,
  bookmarkCount,
  bookmarked,
}: RecruitmentPostFixture): RecruitmentPostSummaryResponse &
  Pick<RecruitmentPostFixture, 'positions'> => ({
  id,
  author,
  title,
  recruitmentType,
  progressMethod,
  recruitmentStatus,
  capacity,
  activityDurationMonths,
  technologyStacks,
  positions,
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

/** 부모 댓글·대댓글 조회의 기본 건수와 상한. 백엔드 `RecruitmentPostCommentApi` 의 값이다. */
const DEFAULT_COMMENT_SIZE = 10;
const DEFAULT_REPLY_SIZE = 5;
const MAX_COMMENT_SIZE = 30;
/** 부모 댓글에 붙는 대댓글 미리보기 건수. 백엔드 `REPLY_PREVIEW_SIZE`. */
const REPLY_PREVIEW_SIZE = 5;
/** 삭제된 부모 댓글 자리에 백엔드가 넣는 문구(`DELETED_COMMENT_CONTENT`). */
const DELETED_COMMENT_CONTENT = '삭제된 댓글입니다';

/**
 * 목 모드의 댓글 저장소. 작성·삭제가 이 배열을 고쳐 서버 프로세스가 도는 동안 남는다 — 다시
 * 띄우면 픽스처로 돌아간다. 픽스처 배열을 직접 고치지 않도록 복사해 둔다.
 */
const commentStore: RecruitmentPostCommentFixture[] = RECRUITMENT_POST_COMMENT_FIXTURES.map(
  (comment) => ({ ...comment }),
);
let nextCommentId = 10_000;

const commentNotFound = () => {
  const body: ErrorResponse = {
    status: 404,
    code: 'RECRUITMENT_POST_COMMENT_NOT_FOUND',
    message: '댓글을 찾을 수 없습니다.',
  };
  return HttpResponse.json(body, { status: 404 });
};

const commentUnauthorized = () => {
  const body: ErrorResponse = { status: 401, code: 'UNAUTHORIZED', message: '인증이 필요합니다.' };
  return HttpResponse.json(body, { status: 401 });
};

/** 토큰은 검사하지 않는다. `Authorization` 이 실려 오면 목 사용자로 본다(픽스처 설명). */
const commentViewer = (request: Request): number | null =>
  request.headers.get('Authorization') ? MOCK_VIEWER_USER_ID : null;

/** 댓글을 다는 모집글. 숫자가 아니거나 없는 글이면 `undefined` 다. */
const findCommentPost = (rawPostId: string) =>
  INTEGER_PATTERN.test(rawPostId)
    ? RECRUITMENT_POST_FIXTURES.find((post) => post.id === Number(rawPostId))
    : undefined;

const readCommentPage = (
  searchParams: URLSearchParams,
  defaultSize: number,
): { page: number; size: number } | string => {
  const pageParam = searchParams.get('page') ?? String(DEFAULT_PAGE);
  const sizeParam = searchParams.get('size') ?? String(defaultSize);
  if (!INTEGER_PATTERN.test(pageParam) || Number(pageParam) < 1) {
    return '[page] must be greater than or equal to 1';
  }
  if (!INTEGER_PATTERN.test(sizeParam) || Number(sizeParam) < 1) {
    return '[size] must be greater than or equal to 1';
  }
  if (Number(sizeParam) > MAX_COMMENT_SIZE) {
    return `[size] must be less than or equal to ${MAX_COMMENT_SIZE}`;
  }
  return { page: Number(pageParam), size: Number(sizeParam) };
};

const toCommentResponse = (
  comment: RecruitmentPostCommentFixture,
  viewer: number | null,
): RecruitmentPostCommentResponse => ({
  id: comment.id,
  parentId: comment.parentId,
  author: {
    userId: comment.userId,
    nickname: comment.nickname,
    profileImageUrl: comment.profileImageUrl,
  },
  content: comment.deletedAt ? DELETED_COMMENT_CONTENT : comment.content,
  createdAt: comment.createdAt,
  updatedAt: comment.createdAt,
  mine: viewer === comment.userId,
});

const pageOf = <T>(items: T[], page: number, size: number) => ({
  items: items.slice((page - 1) * size, page * size),
  pageInfo: {
    pageNum: page,
    pageSize: size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
  },
});

/** 살아 있는 대댓글, 오래된 순. 삭제된 대댓글은 백엔드처럼 빼고 센다. */
const activeReplies = (postId: number, parentId: number) =>
  commentStore
    .filter((c) => c.postId === postId && c.parentId === parentId && !c.deletedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);

/**
 * `getRecruitmentPostComments`(`GET /api/v1/recruitment-posts/{postId}/comments`). 부모 댓글
 * 최신순 + 대댓글 미리보기 5 건. 삭제된 부모도 목록에 남고 본문만 바뀐다(백엔드와 같다).
 */
const getRecruitmentPostCommentsHandler = http.get(
  '*/api/v1/recruitment-posts/:postId/comments',
  ({ params, request }) => {
    const post = findCommentPost(String(params.postId));
    if (!post) {
      return commentNotFound();
    }
    const paging = readCommentPage(new URL(request.url).searchParams, DEFAULT_COMMENT_SIZE);
    if (typeof paging === 'string') {
      return recruitmentPostBadRequest(paging);
    }
    const viewer = commentViewer(request);
    const roots = commentStore
      .filter((c) => c.postId === post.id && c.parentId === undefined)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
    const page = pageOf(roots, paging.page, paging.size);

    const toRoot = (comment: RecruitmentPostCommentFixture): RecruitmentPostCommentRootResponse => {
      const preview = pageOf(activeReplies(post.id, comment.id), 1, REPLY_PREVIEW_SIZE);
      return {
        ...toCommentResponse(comment, viewer),
        replies: {
          items: preview.items.map((reply) => toCommentResponse(reply, viewer)),
          pageInfo: preview.pageInfo,
        },
      };
    };

    const body: SuccessResponsePageResponseRecruitmentPostCommentRootResponse = {
      status: 200,
      message: '요청이 성공했습니다.',
      data: { items: page.items.map(toRoot), pageInfo: page.pageInfo },
    };
    return HttpResponse.json(body, { status: 200 });
  },
);

/** `getRecruitmentPostCommentReplies`(`GET .../comments/{commentId}/replies`). 오래된 순. */
const getRecruitmentPostCommentRepliesHandler = http.get(
  '*/api/v1/recruitment-posts/:postId/comments/:commentId/replies',
  ({ params, request }) => {
    const post = findCommentPost(String(params.postId));
    const parentId = Number(params.commentId);
    const parent = commentStore.find(
      (c) => c.id === parentId && c.postId === post?.id && c.parentId === undefined,
    );
    if (!post || !parent) {
      return commentNotFound();
    }
    const paging = readCommentPage(new URL(request.url).searchParams, DEFAULT_REPLY_SIZE);
    if (typeof paging === 'string') {
      return recruitmentPostBadRequest(paging);
    }
    const viewer = commentViewer(request);
    const page = pageOf(activeReplies(post.id, parentId), paging.page, paging.size);

    const body: SuccessResponsePageResponseRecruitmentPostCommentResponse = {
      status: 200,
      message: '요청이 성공했습니다.',
      data: {
        items: page.items.map((reply) => toCommentResponse(reply, viewer)),
        pageInfo: page.pageInfo,
      },
    };
    return HttpResponse.json(body, { status: 200 });
  },
);

/**
 * `createRecruitmentPostComment`(`POST .../comments`). 대댓글의 부모는 살아 있는 부모 댓글이어야
 * 한다 — 대댓글에 다시 답글은 400, 지워진 부모는 404 다. 모집글의 `commentCount` 를 1 늘린다.
 */
const createRecruitmentPostCommentHandler = http.post(
  '*/api/v1/recruitment-posts/:postId/comments',
  async ({ params, request }) => {
    const viewer = commentViewer(request);
    if (viewer === null) {
      return commentUnauthorized();
    }
    const post = findCommentPost(String(params.postId));
    if (!post) {
      return commentNotFound();
    }
    const { content, parentId } = (await request.json()) as CreateRecruitmentPostCommentRequest;
    if (!content?.trim() || content.length > 1000) {
      return recruitmentPostBadRequest('[content] 1자 이상 1000자 이하로 입력해 주세요.');
    }
    if (parentId !== undefined) {
      const parent = commentStore.find(
        (c) => c.id === parentId && c.postId === post.id && !c.deletedAt,
      );
      if (!parent) {
        return commentNotFound();
      }
      if (parent.parentId !== undefined) {
        return recruitmentPostBadRequest('대댓글에는 다시 답글을 작성할 수 없습니다.');
      }
    }

    const id = nextCommentId++;
    commentStore.push({
      id,
      postId: post.id,
      parentId,
      userId: viewer,
      nickname: MOCK_VIEWER_NICKNAME,
      content,
      createdAt: minutesAgo(0),
    });
    post.commentCount += 1;

    const body: SuccessResponseCreateRecruitmentPostCommentResponse = {
      status: 201,
      message: '요청이 성공했습니다.',
      data: { id },
    };
    return HttpResponse.json(body, { status: 201 });
  },
);

/**
 * `deleteRecruitmentPostComment`(`DELETE .../comments/{commentId}`). 작성자 본인만 지운다(403).
 * 소프트 삭제라 부모의 대댓글은 남는다. 모집글의 `commentCount` 를 1 줄인다.
 */
const deleteRecruitmentPostCommentHandler = http.delete(
  '*/api/v1/recruitment-posts/:postId/comments/:commentId',
  ({ params, request }) => {
    const viewer = commentViewer(request);
    if (viewer === null) {
      return commentUnauthorized();
    }
    const post = findCommentPost(String(params.postId));
    const comment = commentStore.find(
      (c) => c.id === Number(params.commentId) && c.postId === post?.id && !c.deletedAt,
    );
    if (!post || !comment) {
      return commentNotFound();
    }
    if (comment.userId !== viewer) {
      const body: ErrorResponse = {
        status: 403,
        code: 'RECRUITMENT_POST_COMMENT_PERMISSION_DENIED',
        message: '댓글을 삭제할 권한이 없습니다.',
      };
      return HttpResponse.json(body, { status: 403 });
    }

    comment.deletedAt = minutesAgo(0);
    post.commentCount = Math.max(0, post.commentCount - 1);
    return HttpResponse.json({ status: 200, message: '요청이 성공했습니다.' }, { status: 200 });
  },
);

/** `reportRecruitmentPostComment`(`POST .../comments/{commentId}/reports`). 저장하지 않는다. */
const reportRecruitmentPostCommentHandler = http.post(
  '*/api/v1/recruitment-posts/:postId/comments/:commentId/reports',
  ({ params, request }) => {
    if (commentViewer(request) === null) {
      return commentUnauthorized();
    }
    const post = findCommentPost(String(params.postId));
    const comment = commentStore.find(
      (c) => c.id === Number(params.commentId) && c.postId === post?.id && !c.deletedAt,
    );
    if (!comment) {
      return commentNotFound();
    }
    return HttpResponse.json({ status: 201, message: '요청이 성공했습니다.' }, { status: 201 });
  },
);

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

/**
 * `createServiceFeedback`(`POST /api/v1/service-feedbacks`). 저장하지 않는다. 백엔드처럼 두 문항이
 * 모두 비었거나(공백만 있어도 빈 것) 1000자를 넘으면 400 이다.
 */
let serviceFeedbackId = 0;
const createServiceFeedbackHandler = http.post(
  '*/api/v1/service-feedbacks',
  async ({ request }) => {
    const { satisfaction, improvement } = (await request.json()) as CreateServiceFeedbackRequest;
    const answers = [satisfaction, improvement].map((answer) => answer?.trim() ?? '');
    const empty = answers.every((answer) => answer === '');
    if (empty || answers.some((answer) => answer.length > 1000)) {
      const body: ErrorResponse = {
        status: 400,
        code: 'BAD_REQUEST',
        message: '만족스러운 점과 아쉬운 점 중 하나 이상을 1000자 이하로 입력해 주세요.',
      };
      return HttpResponse.json(body, { status: 400 });
    }
    serviceFeedbackId += 1;
    return HttpResponse.json(
      { status: 201, message: '요청이 성공했습니다.', data: { id: serviceFeedbackId } },
      { status: 201 },
    );
  },
);

/**
 * `POST /api/v1/images`(이미지 업로드). 파일은 받지 않고 늘 같은 실제 이미지 주소를 준다 — 목업에는
 * 올린 파일을 둘 곳이 없다. 식별자는 요청마다 다르게 준다. 본문 이미지 노드가 이 둘을 담는다.
 */
const MOCK_UPLOADED_IMAGE_URL =
  'https://letsintern-bucket.s3.ap-northeast-2.amazonaws.com/images/work24/3e73c50619eb40de51e78fd8da445c1bb850fb2b.jpg';

const uploadImageHandler = http.post('*/api/v1/images', () => {
  const body: SuccessResponseImageUploadResponse = {
    status: 201,
    message: 'Created',
    data: {
      id: crypto.randomUUID(),
      url: MOCK_UPLOADED_IMAGE_URL,
      mimeType: 'image/jpeg',
      size: 0,
    },
  };
  return HttpResponse.json(body, { status: 201 });
});

export const handlers: HttpHandler[] = [
  uploadImageHandler,
  getJobsHandler,
  // `getJobHandler`보다 앞이어야 한다 — `*/api/v1/jobs/:jobId`가 `/jobs/calendar`도 잡는다.
  getJobCalendarHandler,
  getJobHandler,
  getBootcampsHandler,
  getBootcampHandler,
  getRecruitmentPostsHandler,
  getRecruitmentPostHandler,
  getRecruitmentPostCommentsHandler,
  getRecruitmentPostCommentRepliesHandler,
  createRecruitmentPostCommentHandler,
  deleteRecruitmentPostCommentHandler,
  reportRecruitmentPostCommentHandler,
  getNoticesHandler,
  getNoticeHandler,
  createServiceFeedbackHandler,
];
