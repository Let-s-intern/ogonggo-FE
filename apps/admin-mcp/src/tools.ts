import { z } from 'zod';
import type {
  ListAdvertisementContractsCategory,
  ListAdvertisementContractsPromotionTarget,
  ListAdvertisementContractsSource,
  ListAdvertisementContractsStatusItem,
  ListAdvertisementInquiriesInquiryType,
  ListAdvertisementInquiriesMemberType,
  ListAdvertisementInquiriesStatusItem,
  ListBootcampsReviewStatus,
  ListBootcampsSort,
  ListBootcampsSource,
  ListBootcampsStatus,
  ListBootcampsVisibility,
  ListCompanyMembersStatus,
  ListGeneralMembersInflowSource,
  ListGeneralMembersRole,
  ListGeneralMembersStatus,
  ListJobsRecruitmentStatus,
  ListJobsReviewStatus,
  ListJobsSort,
  ListJobsSource,
  ListJobsVisibility,
} from '@ogonggo/api/src/generated/admin/models';

/**
 * MCP 로 여는 관리자 API. 1차는 조회만 연다(PRD 5-5).
 *
 * `@ogonggo/api` 는 타입만 가져온다. 생성 함수(`listJobs` 등)는 쓰지 않는다 — 그쪽 `httpClient` 는 서버에서
 * 사용자 API 주소(`OGONGGO_USER_API_ORIGIN`)를 붙이고 토큰 공급자가 모듈 전역 하나라 이 서버에 맞지 않는다.
 * 타입만 쓰면 실행 코드에는 남지 않아 배포 묶음에 워크스페이스 TS 소스가 들어가지 않는다.
 */

/**
 * 생성 타입 `T` 의 값을 빠짐없이 적은 enum. 백엔드에 값이 늘어 codegen 을 다시 하면 여기서 타입 오류가 나
 * 목록을 맞추게 된다(`packages/api/src/enums.typecheck.ts` 와 같은 생각).
 */
function enumOf<T extends string>() {
  return <const V extends readonly [T, ...T[]]>(
    values: V &
      ([Exclude<T, V[number]>] extends [never] ? unknown : { missing: Exclude<T, V[number]> }),
  ) => z.enum(values);
}

const page = z.number().int().min(1).optional().describe('페이지 번호(1부터). 기본 1');
const size = z.number().int().min(1).max(100).optional().describe('페이지 크기(1~100). 기본 10');
const date = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe(`${label}(YYYY-MM-DD, 포함)`);
const id = (label: string) => z.number().int().positive().describe(label);

export interface AdminTool {
  name: string;
  title: string;
  description: string;
  input: z.ZodRawShape;
  /** 인자로 관리자 API 경로를 만든다. 경로에 쓴 인자는 쿼리에 다시 넣지 않는다. */
  path: (args: Record<string, unknown>) => string;
  pathParams?: string[];
}

const ADMIN = '/api/v1/admin';

export const ADMIN_TOOLS: AdminTool[] = [
  {
    name: 'list_jobs',
    title: '채용공고 목록',
    description:
      '관리자 채용공고 목록을 검색한다. 키워드, 공개 여부, 출처, 검수 상태, 모집 상태, 등록일로 거른다.',
    input: {
      page,
      size,
      keyword: z.string().optional().describe('제목·회사명 검색어'),
      sort: enumOf<ListJobsSort>()(['REGISTERED_AT', 'VIEW_COUNT']).optional(),
      visibility: enumOf<ListJobsVisibility>()(['VISIBLE', 'HIDDEN']).optional(),
      source: enumOf<ListJobsSource>()(['CRAWLER', 'COMPANY', 'WORK24']).optional(),
      reviewStatus: enumOf<ListJobsReviewStatus>()(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      recruitmentStatus: enumOf<ListJobsRecruitmentStatus>()(['RECRUITING', 'CLOSED']).optional(),
      registeredFrom: date('등록일 시작'),
      registeredTo: date('등록일 끝'),
      inspected: z.boolean().optional().describe('검수 완료 여부'),
    },
    path: () => `${ADMIN}/jobs`,
  },
  {
    name: 'get_job',
    title: '채용공고 상세',
    description: '채용공고 하나의 상세(본문, 검수·공개 상태 포함)를 본다.',
    input: { jobId: id('채용공고 ID') },
    path: (args) => `${ADMIN}/jobs/${args.jobId}`,
    pathParams: ['jobId'],
  },
  {
    name: 'list_today_jobs',
    title: '오늘의 공고',
    description: '오늘의 공고로 지정된 채용공고 목록을 본다.',
    input: {},
    path: () => `${ADMIN}/jobs/today`,
  },
  {
    name: 'list_bootcamps',
    title: '부트캠프 목록',
    description: '관리자 부트캠프 목록을 검색한다.',
    input: {
      page,
      size,
      keyword: z.string().optional().describe('검색어'),
      sort: enumOf<ListBootcampsSort>()(['REGISTERED_AT', 'VIEW_COUNT']).optional(),
      visibility: enumOf<ListBootcampsVisibility>()(['VISIBLE', 'HIDDEN']).optional(),
      source: enumOf<ListBootcampsSource>()(['CRAWLER', 'COMPANY', 'WORK24']).optional(),
      reviewStatus: enumOf<ListBootcampsReviewStatus>()([
        'PENDING',
        'APPROVED',
        'REJECTED',
      ]).optional(),
      status: enumOf<ListBootcampsStatus>()(['DRAFT', 'RECRUITING', 'CLOSED']).optional(),
    },
    path: () => `${ADMIN}/bootcamps`,
  },
  {
    name: 'get_bootcamp',
    title: '부트캠프 상세',
    description: '부트캠프 하나의 상세를 본다.',
    input: { bootcampId: id('부트캠프 ID') },
    path: (args) => `${ADMIN}/bootcamps/${args.bootcampId}`,
    pathParams: ['bootcampId'],
  },
  {
    name: 'list_general_members',
    title: '일반 회원 목록',
    description: '일반 회원(렛츠커리어 계정) 목록을 검색한다. 개인정보가 포함된다.',
    input: {
      page,
      size,
      keyword: z.string().optional().describe('이름·이메일·닉네임 검색어'),
      status: enumOf<ListGeneralMembersStatus>()(['ACTIVE', 'WITHDRAWN', 'SUSPENDED']).optional(),
      role: enumOf<ListGeneralMembersRole>()(['USER', 'COMPANY', 'ADMIN', 'MENTOR']).optional(),
      inflowSource: enumOf<ListGeneralMembersInflowSource>()(['LETSCAREER', 'OGONGGO']).optional(),
      joinedFrom: date('가입일 시작'),
      joinedTo: date('가입일 끝'),
    },
    path: () => `${ADMIN}/general-members`,
  },
  {
    name: 'get_general_member',
    title: '일반 회원 상세',
    description: '일반 회원 한 명의 상세를 본다. 개인정보가 포함된다.',
    input: { userId: id('회원 ID') },
    path: (args) => `${ADMIN}/general-members/${args.userId}`,
    pathParams: ['userId'],
  },
  {
    name: 'list_company_members',
    title: '기업 회원 목록',
    description: '기업 회원 목록을 검색한다.',
    input: {
      page,
      size,
      keyword: z.string().optional().describe('기업명·이메일 검색어'),
      status: enumOf<ListCompanyMembersStatus>()(['ACTIVE', 'WITHDRAWN', 'SUSPENDED']).optional(),
      joinedFrom: date('가입일 시작'),
      joinedTo: date('가입일 끝'),
    },
    path: () => `${ADMIN}/company-members`,
  },
  {
    name: 'get_company_member',
    title: '기업 회원 상세',
    description: '기업 회원 하나의 상세를 본다.',
    input: { userId: id('기업 회원 ID') },
    path: (args) => `${ADMIN}/company-members/${args.userId}`,
    pathParams: ['userId'],
  },
  {
    name: 'list_advertisement_inquiries',
    title: '광고 문의 목록',
    description: '광고 문의 목록을 최근 순으로 본다. 처리 상태는 여러 개를 고를 수 있다.',
    input: {
      page,
      size,
      inquiryType: enumOf<ListAdvertisementInquiriesInquiryType>()([
        'FREE_PROMOTION',
        'LAUNCH_ALERT',
      ]).optional(),
      status: z
        .array(
          enumOf<ListAdvertisementInquiriesStatusItem>()([
            'RECEIVED',
            'CONTACTED',
            'EXECUTED',
            'REJECTED',
          ]),
        )
        .optional()
        .describe('처리 상태(여러 개면 그중 하나)'),
      memberType: enumOf<ListAdvertisementInquiriesMemberType>()([
        'COMPANY',
        'USER',
        'GUEST',
      ]).optional(),
      campaignCode: z.string().optional(),
      createdFrom: date('접수일 시작'),
      createdTo: date('접수일 끝'),
    },
    path: () => `${ADMIN}/advertisement-inquiries`,
  },
  {
    name: 'get_advertisement_inquiry_today_count',
    title: '오늘 광고 문의 수',
    description: '오늘 접수된 광고 문의 수를 본다.',
    input: {},
    path: () => `${ADMIN}/advertisement-inquiries/today-count`,
  },
  {
    name: 'list_advertisement_contracts',
    title: '광고 계약 목록',
    description: '광고 계약 목록을 검색한다.',
    input: {
      page,
      size,
      source: enumOf<ListAdvertisementContractsSource>()([
        'APPLICATION_FORM',
        'COMPANY_POSTING',
      ]).optional(),
      status: z
        .array(
          enumOf<ListAdvertisementContractsStatusItem>()([
            'REQUESTED',
            'NEGOTIATING',
            'APPROVED',
            'REJECTED',
          ]),
        )
        .optional()
        .describe('계약 상태(여러 개면 그중 하나)'),
      promotionTarget: enumOf<ListAdvertisementContractsPromotionTarget>()([
        'JOB',
        'BOOTCAMP',
      ]).optional(),
      category: enumOf<ListAdvertisementContractsCategory>()([
        'JOB_POSTING',
        'BANNER',
        'KAKAO_CRM',
        'INSTAGRAM_1',
        'INSTAGRAM_2',
        'KAKAO_1',
        'KAKAO_2',
      ]).optional(),
      companyName: z.string().optional(),
      createdFrom: date('신청일 시작'),
      createdTo: date('신청일 끝'),
    },
    path: () => `${ADMIN}/advertisement-contracts`,
  },
  {
    name: 'get_advertisement_contract',
    title: '광고 계약 상세',
    description: '광고 계약 하나의 상세(상품, 대상 포함)를 본다.',
    input: { contractId: id('광고 계약 ID') },
    path: (args) => `${ADMIN}/advertisement-contracts/${args.contractId}`,
    pathParams: ['contractId'],
  },
  {
    name: 'get_advertisement_contract_report_summary',
    title: '광고 계약 성과 요약',
    description: '광고 계약의 성과 요약(노출·클릭 등)을 본다.',
    input: { contractId: id('광고 계약 ID') },
    path: (args) => `${ADMIN}/advertisement-contracts/${args.contractId}/report-summary`,
    pathParams: ['contractId'],
  },
  {
    name: 'list_service_feedbacks',
    title: '서비스 피드백 목록',
    description: '사용자가 남긴 서비스 피드백 목록을 본다.',
    input: { page, size },
    path: () => `${ADMIN}/service-feedbacks`,
  },
  {
    name: 'get_recent_notification_results',
    title: '최근 알림 발송 결과',
    description: '최근 알림 발송 결과를 본다.',
    input: {},
    path: () => `${ADMIN}/notifications/recent-results`,
  },
];

/** 경로에 쓰지 않은 인자를 쿼리로. 배열은 `status=A&status=B` 처럼 반복한다(생성 URL 함수와 같다). */
export function queryOf(tool: AdminTool, args: Record<string, unknown>): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null || tool.pathParams?.includes(key)) {
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, String(item)));
    } else {
      query.append(key, String(value));
    }
  }
  return query;
}
