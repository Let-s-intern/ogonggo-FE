import type {
  MyAdvertisementContractDetailResponse,
  MyAdvertisementContractProductResponse,
  MyAdvertisementContractSummaryResponse,
} from '../../generated/user/models';

/**
 * 비즈니스 회원의 내 광고 계약 목(`GET /api/v1/users/me/advertisement-contracts`, 상세). 비즈니스 앱
 * (`apps/business`)의 목 모드가 본다. 어드민 계약 목(`./advertisement-contracts.ts`)과는 따로 둔다 — 어드민은
 * 여러 기업의 계약을, 여기는 로그인한 한 기업의 계약만 보인다.
 *
 * 리포트 화면(광고 성과 리포트 Push 4)을 위해 상품 종류를 고루 둔다. 배너(진행 중), 광고 공고(진행 중),
 * 기간을 아직 안 넣은 배너, 채널 상품(카카오톡), 그리고 끝난 배너.
 */

/** 리포트를 못 여는 이유(`광고-리포트-API-계약-2026-11-19.md` 3절). 코드젠 전까지 목이 직접 붙인다. */
export type MockReportUnavailableReason = 'NO_PERIOD' | 'NOT_EXPOSABLE';

export interface MyContractProductFixture extends MyAdvertisementContractProductResponse {
  /** 리포트 응답의 `product.productId`. 계약 상세 응답에는 없다. */
  productId: number;
  reportAvailable: boolean;
  reportUnavailableReason: MockReportUnavailableReason | null;
}

export interface MyContractFixture extends MyAdvertisementContractDetailResponse {
  products: MyContractProductFixture[];
}

const COMPANY = {
  source: 'APPLICATION_FORM',
  companyName: '오공고 테스트 기업',
  managerName: '김담당',
  email: 'company@example.com',
  phoneNumber: '010-1234-5678',
} as const;

const SEED: MyContractFixture[] = [
  {
    id: 101,
    status: 'APPROVED',
    promotionTarget: 'JOB',
    ...COMPANY,
    recruitmentTitle: '2027 상반기 신입 백엔드 개발자',
    recruitmentUrl: 'https://careers.example.com/ogonggo/backend',
    recruitmentDeadline: '2026-11-30',
    purpose: 'FIT_APPLICANTS',
    budgetAmount: 1000000,
    categories: ['BANNER', 'JOB_POSTING', 'KAKAO_1'],
    scheduleRequest: '11월 한 달',
    advertisementRequest: '컴퓨터공학 전공자에게 많이 보였으면 합니다.',
    businessNumberType: 'BUSINESS_REGISTRATION',
    businessNumber: '1234567890',
    invoiceMethod: 'TAX_INVOICE',
    creativeMethod: 'REQUEST_PRODUCTION',
    paymentAmount: 900000,
    registeredAt: '2026-10-27T10:12:00',
    products: [
      {
        contractProductId: 11,
        productId: 1,
        productName: '채용공고 홈 상단 배너',
        category: 'BANNER',
        position: 'JOB_HOME_TOP_BANNER',
        productDeleted: false,
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        reportAvailable: true,
        reportUnavailableReason: null,
      },
      {
        contractProductId: 12,
        productId: 8,
        productName: '채용공고 목록 광고 공고',
        category: 'JOB_POSTING',
        position: null,
        productDeleted: false,
        startDate: '2026-11-05',
        endDate: '2026-11-25',
        reportAvailable: true,
        reportUnavailableReason: null,
      },
      {
        contractProductId: 13,
        productId: 3,
        productName: '공고 상세 배너',
        category: 'BANNER',
        position: 'JOB_DETAIL_BANNER',
        productDeleted: false,
        startDate: null,
        endDate: null,
        reportAvailable: false,
        reportUnavailableReason: 'NO_PERIOD',
      },
      {
        contractProductId: 14,
        productId: 12,
        productName: '카카오톡 직무별 큐레이션 톡방',
        category: 'KAKAO_1',
        position: null,
        productDeleted: false,
        startDate: '2026-11-10',
        endDate: '2026-11-17',
        reportAvailable: false,
        reportUnavailableReason: 'NOT_EXPOSABLE',
      },
    ],
  },
  {
    id: 102,
    status: 'APPROVED',
    promotionTarget: 'BOOTCAMP',
    ...COMPANY,
    recruitmentTitle: '프론트엔드 부트캠프 12기',
    recruitmentUrl: 'https://careers.example.com/ogonggo/fe-12',
    recruitmentDeadline: '2026-10-31',
    purpose: 'BRAND_AWARENESS',
    budgetAmount: 300000,
    categories: ['BANNER'],
    invoiceMethod: 'NEGOTIATE',
    creativeMethod: 'PROVIDE_DIRECTLY',
    paymentAmount: 300000,
    registeredAt: '2026-10-02T09:40:00',
    products: [
      {
        contractProductId: 21,
        productId: 4,
        productName: '부트캠프 목록 상단 배너',
        category: 'BANNER',
        position: 'BOOTCAMP_LIST_TOP_BANNER',
        productDeleted: false,
        startDate: '2026-10-13',
        endDate: '2026-10-26',
        reportAvailable: true,
        reportUnavailableReason: null,
      },
    ],
  },
  {
    id: 103,
    status: 'NEGOTIATING',
    promotionTarget: 'JOB',
    ...COMPANY,
    recruitmentTitle: '데이터 분석 인턴',
    recruitmentUrl: 'https://careers.example.com/ogonggo/data-intern',
    recruitmentDeadline: '2026-12-15',
    purpose: 'FAST_APPLICANTS',
    categories: ['INSTAGRAM_1'],
    invoiceMethod: 'TAX_INVOICE',
    creativeMethod: 'REQUEST_PRODUCTION',
    registeredAt: '2026-11-12T14:00:00',
    products: [],
  },
  {
    id: 104,
    status: 'REQUESTED',
    promotionTarget: 'JOB',
    ...COMPANY,
    recruitmentTitle: '사업개발 매니저(경력 3년 이상)',
    recruitmentUrl: 'https://careers.example.com/ogonggo/bizdev',
    recruitmentDeadline: '2026-12-20',
    purpose: 'FAST_APPLICANTS',
    categories: ['BANNER'],
    invoiceMethod: 'TAX_INVOICE',
    creativeMethod: 'REQUEST_PRODUCTION',
    registeredAt: '2026-11-18T17:05:00',
    products: [],
  },
  {
    id: 105,
    status: 'REJECTED',
    promotionTarget: 'JOB',
    ...COMPANY,
    recruitmentTitle: '영업 담당자',
    recruitmentUrl: 'https://careers.example.com/ogonggo/sales',
    recruitmentDeadline: '2026-10-20',
    purpose: 'FAST_APPLICANTS',
    categories: ['BANNER'],
    invoiceMethod: 'TAX_INVOICE',
    creativeMethod: 'PROVIDE_DIRECTLY',
    paymentAmount: 0,
    registeredAt: '2026-09-28T08:30:00',
    products: [],
  },
];

export function myContractSeed(): MyContractFixture[] {
  return SEED.map((contract) => ({
    ...contract,
    categories: [...contract.categories],
    products: contract.products.map((product) => ({ ...product })),
  }));
}

/** 목록 한 줄. 상세에서 신청서 칸과 계약 상품을 뺀 것이다. */
export function toMyContractSummary({
  id,
  source,
  status,
  promotionTarget,
  companyName,
  recruitmentTitle,
  recruitmentDeadline,
  categories,
  paymentAmount,
  registeredAt,
}: MyContractFixture): MyAdvertisementContractSummaryResponse {
  return {
    id,
    source,
    status,
    promotionTarget,
    companyName,
    recruitmentTitle,
    recruitmentDeadline,
    categories,
    paymentAmount,
    registeredAt,
  };
}
