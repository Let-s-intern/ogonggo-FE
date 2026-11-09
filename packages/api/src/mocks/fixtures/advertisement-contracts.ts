import type {
  AdminAdvertisementContractDetailResponse,
  AdminAdvertisementContractSummaryResponse,
} from '../../generated/admin/models';

/**
 * 광고 계약 목의 시드(BE LC-3583·3584). 어드민 계약 목록·상세와 배너 노출의 연결 계약 고르기가 본다.
 *
 * 신청 폼(`APPLICATION_FORM`)으로 들어온 계약과 기업회원 공고 등록(`COMPANY_POSTING`)이 만든 계약을 섞어 둔다. 비즈니스
 * 공고 계약은 신청서 칸(담당자, 세금계산서 등)이 비어 있고 상태가 공고 검수를 따라간다.
 *
 * 계약 상품(`products`)의 상품 id 는 `./advertisement-exposures.ts` 의 상품 시드를 가리킨다.
 */

const CONTRACT_SEED: AdminAdvertisementContractDetailResponse[] = [
  {
    id: 1,
    source: 'APPLICATION_FORM',
    status: 'APPROVED',
    promotionTarget: 'JOB',
    companyName: '새싹컴퍼니',
    recruitmentTitle: '2027 상반기 신입 백엔드 개발자',
    recruitmentUrl: 'https://careers.example.com/saessak/backend',
    recruitmentDeadline: '2026-12-15',
    purpose: 'FIT_APPLICANTS',
    categories: ['BANNER', 'JOB_POSTING'],
    scheduleRequest: '11월 셋째 주부터 2주간 공고 상세 배너',
    advertisementRequest: '컴퓨터공학 전공자에게 많이 보였으면 합니다.',
    managerName: '김새싹',
    email: 'hr@saessak.example.com',
    phoneNumber: '010-1234-5678',
    invoiceMethod: 'TAX_INVOICE',
    creativeMethod: 'PROVIDE_DIRECTLY',
    paymentAmount: 400000,
    registeredAt: '2026-11-02T10:12:00',
    updatedAt: '2026-11-04T15:30:00',
    products: [
      {
        contractProductId: 1,
        productId: 3,
        productName: '공고 상세 배너',
        category: 'BANNER',
        productDeleted: false,
        addedAt: '2026-11-04T15:20:00',
      },
    ],
  },
  {
    id: 2,
    source: 'APPLICATION_FORM',
    status: 'NEGOTIATING',
    promotionTarget: 'BOOTCAMP',
    companyName: '코드캠프',
    recruitmentTitle: '프론트엔드 부트캠프 12기',
    recruitmentUrl: 'https://codecamp.example.com/fe-12',
    recruitmentDeadline: '2026-12-01',
    purpose: 'BRAND_AWARENESS',
    categories: ['BANNER', 'INSTAGRAM_1'],
    scheduleRequest: '모집 마감 전까지',
    managerName: '박코드',
    email: 'ad@codecamp.example.com',
    phoneNumber: '02-555-0101',
    invoiceMethod: 'NEGOTIATE',
    creativeMethod: 'REQUEST_PRODUCTION',
    registeredAt: '2026-11-05T09:40:00',
    updatedAt: '2026-11-06T11:00:00',
    products: [],
  },
  {
    id: 3,
    source: 'APPLICATION_FORM',
    status: 'REQUESTED',
    promotionTarget: 'JOB',
    companyName: '오렌지랩',
    recruitmentTitle: '데이터 분석 인턴',
    purpose: 'FAST_APPLICANTS',
    categories: ['KAKAO_1'],
    managerName: '이오렌',
    email: 'people@orangelab.example.com',
    phoneNumber: '010-2222-3333',
    invoiceMethod: 'TAX_INVOICE',
    creativeMethod: 'REQUEST_PRODUCTION',
    registeredAt: '2026-11-08T17:05:00',
    updatedAt: '2026-11-08T17:05:00',
    products: [],
  },
  {
    id: 4,
    source: 'COMPANY_POSTING',
    status: 'APPROVED',
    promotionTarget: 'JOB',
    userId: 3,
    targetId: 2,
    companyName: '새싹컴퍼니',
    recruitmentTitle: '사업개발 매니저(경력 3년 이상)',
    recruitmentDeadline: '2026-11-30',
    categories: ['JOB_POSTING'],
    registeredAt: '2026-11-03T13:00:00',
    updatedAt: '2026-11-03T16:20:00',
    products: [
      {
        contractProductId: 2,
        productId: 7,
        productName: '비즈니스 공고 등록',
        category: 'JOB_POSTING',
        productDeleted: false,
        addedAt: '2026-11-03T16:20:00',
      },
    ],
  },
  {
    id: 5,
    source: 'APPLICATION_FORM',
    status: 'REJECTED',
    promotionTarget: 'JOB',
    companyName: '블루오션',
    recruitmentTitle: '영업 담당자',
    purpose: 'FAST_APPLICANTS',
    categories: ['BANNER'],
    managerName: '최블루',
    email: 'sales@blueocean.example.com',
    phoneNumber: '010-9999-0000',
    invoiceMethod: 'TAX_INVOICE',
    creativeMethod: 'PROVIDE_DIRECTLY',
    paymentAmount: 0,
    registeredAt: '2026-10-28T08:30:00',
    updatedAt: '2026-10-30T10:00:00',
    products: [],
  },
];

export function contractSeed(): AdminAdvertisementContractDetailResponse[] {
  return CONTRACT_SEED.map((contract) => ({
    ...contract,
    categories: [...contract.categories],
    products: contract.products.map((product) => ({ ...product })),
  }));
}

/** 목록 한 줄. 상세에서 신청서 칸과 계약 상품을 뺀 것이다. */
export function toContractSummary({
  id,
  source,
  status,
  promotionTarget,
  targetId,
  companyName,
  recruitmentTitle,
  recruitmentDeadline,
  categories,
  paymentAmount,
  registeredAt,
  updatedAt,
}: AdminAdvertisementContractDetailResponse): AdminAdvertisementContractSummaryResponse {
  return {
    id,
    source,
    status,
    promotionTarget,
    targetId,
    companyName,
    recruitmentTitle,
    recruitmentDeadline,
    categories,
    paymentAmount,
    registeredAt,
    updatedAt,
  };
}
