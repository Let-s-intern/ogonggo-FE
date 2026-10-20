import { http, HttpResponse, type HttpHandler, type JsonBodyType } from 'msw';
import { getGetMyBootcampResponseMock, getGetMyJobResponseMock } from '../generated/user/endpoints';
import type { CompanyBootcampSummaryResponse } from '../generated/user/models/companyBootcampSummaryResponse';
import type { CompanyJobSummaryResponse } from '../generated/user/models/companyJobSummaryResponse';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import type { SuccessResponseCompanyBootcampDetailResponse } from '../generated/user/models/successResponseCompanyBootcampDetailResponse';
import type { SuccessResponseCompanyJobDetailResponse } from '../generated/user/models/successResponseCompanyJobDetailResponse';

/**
 * 기업 회원의 내 공고(채용공고·부트캠프) 목 핸들러. 목록·상세·수정·게시·마감·삭제.
 *
 * 생성 핸들러는 검수·게시 상태가 무작위라 마이페이지 목록의 진행 단계를 차례로 볼 수 없다. 단계 판정
 * (`apps/web/src/widgets/company-posts/model/stage.ts`)의 다섯 줄이 각 목록에서 한 번씩은 나오게 손으로
 * 썼다. 날짜는 지금을 기준으로 잡아 D-day 와 마감 판정이 언제 열어도 같게 보인다.
 *
 * 상태 전이는 백엔드를 따른다. 수정하면 검수 대기로 돌아가고 게시 중이었으면 숨김이 된다. 게시는 승인된
 * 공고만 되고 아니면 409 다. 브라우저 워커가 도는 동안 메모리에서 바뀌고, 새로 고치면 처음으로 돌아간다.
 *
 * 상세는 생성된 가짜 응답에 목록과 겹치는 칸만 덮어쓴다. 수정 폼의 나머지 칸은 무작위다.
 */

const DAY = 24 * 60 * 60 * 1000;

/** 지금에서 `days` 일 뒤의 `yyyy-MM-ddTHH:mm:ss`. 음수면 지난 날이다. */
function at(days: number, time = '23:59:00'): string {
  const date = new Date(Date.now() + days * DAY);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time}`;
}

const COMPANY = '오공고 테스트 기업';

const jobBase = {
  companyName: COMPANY,
  employmentType: 'FULL_TIME',
  experienceType: 'NEWCOMER',
  region: 'SEOUL',
  recruitmentType: 'PERIOD',
} as const;

const jobs = new Map<number, CompanyJobSummaryResponse>(
  (
    [
      {
        ...jobBase,
        id: 109,
        title: '2026 하반기 백엔드 엔지니어 신입 채용',
        publicationStatus: 'DRAFT',
        reviewStatus: 'PENDING',
        recruitmentStartAt: at(1, '00:00:00'),
        recruitmentEndAt: at(25),
      },
      {
        ...jobBase,
        id: 108,
        title: '데이터 분석 체험형 인턴',
        employmentType: 'INTERN',
        publicationStatus: 'HIDDEN',
        reviewStatus: 'REJECTED',
        recruitmentStartAt: at(-5, '00:00:00'),
        recruitmentEndAt: at(12),
      },
      {
        ...jobBase,
        id: 107,
        title: '고객 경험(CX) 매니저 경력 채용',
        experienceType: 'EXPERIENCED',
        publicationStatus: 'HIDDEN',
        reviewStatus: 'APPROVED',
        recruitmentStartAt: at(-10, '00:00:00'),
        recruitmentEndAt: at(20),
      },
      {
        ...jobBase,
        id: 106,
        title:
          '2026 하반기 프론트엔드 개발자 신입 공개 채용 (React · TypeScript · 웹 서비스 개발 · 서울 근무)',
        publicationStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
        recruitmentStartAt: at(-20, '00:00:00'),
        recruitmentEndAt: at(1),
      },
      {
        ...jobBase,
        id: 105,
        title: 'UX 디자이너 상시 채용',
        recruitmentType: 'ALWAYS_OPEN',
        publicationStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
      },
      {
        ...jobBase,
        id: 104,
        title: '퍼포먼스 마케팅 인턴',
        employmentType: 'INTERN',
        publicationStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
        recruitmentStartAt: at(-40, '00:00:00'),
        recruitmentEndAt: at(-10),
      },
      {
        ...jobBase,
        id: 103,
        title: '인사 총무 담당자 채용 (조기 마감)',
        publicationStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
        recruitmentStartAt: at(-15, '00:00:00'),
        recruitmentEndAt: at(15),
        closedAt: at(-1, '10:00:00'),
      },
      {
        ...jobBase,
        id: 102,
        title: '영업 관리 계약직 채용',
        employmentType: 'CONTRACT',
        publicationStatus: 'HIDDEN',
        reviewStatus: 'REJECTED',
        recruitmentStartAt: at(-30, '00:00:00'),
        recruitmentEndAt: at(-3),
      },
    ] satisfies CompanyJobSummaryResponse[]
  ).map((job) => [job.id, job]),
);

const bootcampBase = {
  companyName: COMPANY,
  programType: '부트캠프',
  operationType: 'ONLINE',
  recruitmentType: 'PERIOD',
  programStartDate: at(40).slice(0, 10),
  programEndDate: at(160).slice(0, 10),
  capacity: 30,
  tuitionType: 'GOVERNMENT_FUNDED',
  shortDescription: '현업 개발자와 함께하는 실무 중심 교육',
  status: 'RECRUITING',
} as const;

const bootcamps = new Map<number, CompanyBootcampSummaryResponse>(
  (
    [
      {
        ...bootcampBase,
        id: 204,
        title: '프론트엔드 부트캠프 13기',
        publicationStatus: 'DRAFT',
        reviewStatus: 'PENDING',
        recruitmentStartAt: at(2, '00:00:00'),
        recruitmentEndAt: at(30),
      },
      {
        ...bootcampBase,
        id: 203,
        title: '데이터 엔지니어링 부트캠프 2기',
        publicationStatus: 'HIDDEN',
        reviewStatus: 'REJECTED',
        recruitmentStartAt: at(-3, '00:00:00'),
        recruitmentEndAt: at(18),
      },
      {
        ...bootcampBase,
        id: 202,
        title: '프론트엔드 부트캠프 12기',
        operationType: 'HYBRID',
        publicationStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
        recruitmentStartAt: at(-10, '00:00:00'),
        recruitmentEndAt: at(18),
      },
      {
        ...bootcampBase,
        id: 201,
        title: '백엔드 부트캠프 8기',
        operationType: 'OFFLINE',
        status: 'CLOSED',
        publicationStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
        recruitmentStartAt: at(-60, '00:00:00'),
        recruitmentEndAt: at(-30),
        closedAt: at(-30),
      },
    ] satisfies CompanyBootcampSummaryResponse[]
  ).map((bootcamp) => [bootcamp.id, bootcamp]),
);

type Store<T> = Map<number, T>;

const ok = () => HttpResponse.json({ status: 200, message: '요청이 성공했습니다.' });

const errorResponse = (status: number, code: string, message: string) =>
  HttpResponse.json<ErrorResponse>({ status, code, message }, { status });

const notFound = () => errorResponse(404, 'NOT_FOUND', '공고를 찾을 수 없습니다.');

function page<T extends { id: number }>(store: Store<T>, request: Request) {
  const params = new URL(request.url).searchParams;
  const pageNum = Math.max(Number(params.get('page') ?? 1), 1);
  const size = Math.max(Number(params.get('size') ?? 10), 1);
  const all = [...store.values()].sort((a, b) => b.id - a.id);
  return {
    items: all.slice((pageNum - 1) * size, pageNum * size),
    pageInfo: {
      pageNum,
      pageSize: size,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / size),
    },
  };
}

type Post = CompanyJobSummaryResponse | CompanyBootcampSummaryResponse;

/** 내용을 고치면 다시 검수를 기다리고, 그동안 노출하지 않는다(백엔드 `requestReview`). */
function requestReview(post: Post) {
  post.reviewStatus = 'PENDING';
  if (post.publicationStatus === 'PUBLISHED') {
    post.publicationStatus = 'HIDDEN';
  }
}

/** 한 종류(채용공고·부트캠프)의 핸들러 묶음. 경로와 상세 가짜 응답만 다르다. */
function postHandlers<T extends Post>(
  path: string,
  param: string,
  store: Store<T>,
  detail: (post: T) => JsonBodyType,
): HttpHandler[] {
  const find = (params: Record<string, unknown>) => store.get(Number(params[param]));
  return [
    http.get(`*/api/v1/users/me/${path}`, ({ request }) =>
      HttpResponse.json({
        status: 200,
        message: '요청이 성공했습니다.',
        data: page(store, request),
      }),
    ),
    http.get(`*/api/v1/users/me/${path}/:${param}`, ({ params }) => {
      const post = find(params);
      return post ? HttpResponse.json(detail(post)) : notFound();
    }),
    http.put(`*/api/v1/users/me/${path}/:${param}`, ({ params }) => {
      const post = find(params);
      if (!post) {
        return notFound();
      }
      requestReview(post);
      return ok();
    }),
    http.post(`*/api/v1/users/me/${path}/:${param}/publish`, ({ params }) => {
      const post = find(params);
      if (!post) {
        return notFound();
      }
      if (post.reviewStatus !== 'APPROVED') {
        return errorResponse(409, 'REVIEW_NOT_APPROVED', '검수 승인 전에는 게시할 수 없습니다.');
      }
      post.publicationStatus = 'PUBLISHED';
      return ok();
    }),
    http.post(`*/api/v1/users/me/${path}/:${param}/close`, ({ params }) => {
      const post = find(params);
      if (!post) {
        return notFound();
      }
      post.closedAt = at(0, '00:00:00');
      return ok();
    }),
    http.delete(`*/api/v1/users/me/${path}/:${param}`, ({ params }) => {
      return store.delete(Number(params[param])) ? ok() : notFound();
    }),
  ];
}

/** 생성된 가짜 응답은 `data` 를 무작위로 비운다. 채워진 것이 나올 때까지 다시 만든다. */
function withData<T extends { data?: unknown }>(make: () => T): T {
  for (;;) {
    const body = make();
    if (body.data) {
      return body;
    }
  }
}

export const myCompanyPostHandlers: HttpHandler[] = [
  ...postHandlers('jobs', 'jobId', jobs, (job): SuccessResponseCompanyJobDetailResponse => {
    const base = withData(getGetMyJobResponseMock);
    return { ...base, status: 200, data: { ...base.data!, ...job } };
  }),
  ...postHandlers(
    'bootcamps',
    'bootcampId',
    bootcamps,
    (bootcamp): SuccessResponseCompanyBootcampDetailResponse => {
      const base = withData(getGetMyBootcampResponseMock);
      return { ...base, status: 200, data: { ...base.data!, ...bootcamp } };
    },
  ),
];
