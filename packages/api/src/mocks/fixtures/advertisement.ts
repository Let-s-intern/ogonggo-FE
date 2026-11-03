import { CompanyJobSummaryResponseJobField } from '../../generated/user/models/companyJobSummaryResponseJobField';
import type {
  AdApplication,
  AdCoupon,
  AdJobField,
  AdPlacement,
  AdPlacementAvailabilityResponse,
  AdPlacementKey,
  AdPlacementPeriodAvailability,
  AdReport,
} from './advertisement-types';

/**
 * 광고 시스템 픽스처. 구좌 목록과 기간별 잔여, 광고 신청 셋, 리포트 한 건, 무료 쿠폰 한 장.
 *
 * 출처는 두 시안이다(`.claude/tasks/memos/광고-시스템-시안/`). 구좌 이름·정가·설명은 기업서비스 시안의 페이지별 구좌
 * (`PAGES`)와 광고 시스템 시안의 상품(`PRODUCTS`)에서, 신청 셋은 광고 시스템 시안 `adCards`(소재 검수, 반려, 종료)에서,
 * 리포트는 `rptCards`·`rptRows`·`insights` 에서 옮겼다. 잔여 수와 일별 추이는 시안 모양에 맞춰 지어낸 값이다.
 *
 * 날짜는 지금을 기준으로 잡는다. 신청 가능 범위(다음 주 월요일부터 12주)와 진행 중·종료 판정이 언제 열어도 같게 보인다.
 * 그래서 신청번호의 날짜 부분도 접수일에서 만든다.
 */

const DAY = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

/** 로컬 날짜의 `yyyy-MM-dd`. `toISOString` 은 UTC 라 KST 자정 근처에서 하루가 밀린다. */
function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 이번 주 월요일에서 `weeks` 주 뒤 월요일. 0 이면 이번 주, 1 이면 다음 주다. */
export function mondayAfter(weeks: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sinceMonday = (today.getDay() + 6) % 7;
  return new Date(today.getTime() + (weeks * 7 - sinceMonday) * DAY);
}

const plusDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY);

/** 날짜에 `HH:mm` 을 붙인 `yyyy-MM-ddTHH:mm:00`. */
const at = (date: Date, time: string) => `${ymd(date)}T${time}:00`;

/** `AD-YYMMDD-NNNN`. */
const applicationNo = (receivedAt: Date, seq: number) =>
  `AD-${ymd(receivedAt).slice(2).replaceAll('-', '')}-${String(seq).padStart(4, '0')}`;

const BANNER_SPEC = 'PC 1200×120 · MO 750×200';

export const AD_PLACEMENT_FIXTURES: AdPlacement[] = [
  {
    key: 'RECOMMEND_TOP_RECRUIT',
    name: '오공고 추천 카드',
    page: 'JOB_LIST',
    target: 'JOB',
    format: 'CARD',
    slotCount: 1,
    perJobField: false,
    rolling: false,
    unit: 'WEEK',
    price: 400000,
    description:
      '채용공고 홈 추천 캐러셀 1번 위치. 일반 추천 카드와 같은 레이아웃에 해석 한 줄 + AD 라벨.',
    spec: '공고 링크 + 해석 한 줄 40자',
    expectedCtr: '2.5 ~ 4%',
    couponEligible: false,
    visible: true,
  },
  {
    key: 'LIST_TOP_RECRUIT',
    name: '리스트 상단 고정',
    page: 'JOB_LIST',
    target: 'JOB',
    format: 'CARD',
    slotCount: 1,
    perJobField: true,
    rolling: false,
    unit: 'WEEK',
    price: 300000,
    description: '직무 탭별 공고 리스트 1번 위치에 고정. 정렬과 무관하게 1번, 2페이지부터 비노출.',
    spec: '공고 링크, 로고',
    expectedCtr: '3 ~ 5%',
    couponEligible: true,
    visible: true,
  },
  {
    key: 'ACTIVE_RECRUIT',
    name: '적극 채용중 공고 구좌',
    page: 'JOB_LIST',
    target: 'JOB',
    format: 'CARD',
    slotCount: 4,
    perJobField: false,
    rolling: false,
    unit: 'WEEK',
    price: 400000,
    description:
      '리스트 최상단 "적극 채용중" 영역에 공고 카드 4개가 노출돼요. 일반 공고 카드와 같은 모양에 AD 라벨만 붙어요.',
    spec: '공고 카드 자동 구성',
    expectedCtr: '3 ~ 5%',
    couponEligible: false,
    visible: true,
  },
  {
    key: 'MAIN_TOP_BANNER_RECRUIT',
    name: '메인 상단 배너',
    page: 'JOB_LIST',
    target: 'JOB',
    format: 'BANNER',
    slotCount: 4,
    perJobField: false,
    rolling: true,
    unit: 'WEEK',
    price: 500000,
    description: '적극 채용중 아래, 리스트 위 가로 배너. 4개 소재가 새로고침마다 롤링돼요.',
    spec: BANNER_SPEC,
    expectedCtr: '1 ~ 1.8%',
    couponEligible: false,
    visible: true,
  },
  {
    key: 'MAIN_BOTTOM_BANNER_RECRUIT',
    name: '메인 하단 배너',
    page: 'JOB_LIST',
    target: 'JOB',
    format: 'BANNER',
    slotCount: 1,
    perJobField: false,
    rolling: false,
    unit: 'WEEK',
    price: 300000,
    description:
      '리스트 끝, 페이지네이션 위 단독 배너. 리스트를 끝까지 본 적극 탐색 유저에게 닿아요.',
    spec: BANNER_SPEC,
    expectedCtr: '0.8 ~ 1.5%',
    couponEligible: false,
    visible: true,
  },
  {
    key: 'SIMILAR_TOP_RECRUIT',
    name: '비슷한 공고 상단 노출',
    page: 'JOB_DETAIL',
    target: 'JOB',
    format: 'CARD',
    slotCount: 1,
    perJobField: true,
    rolling: false,
    unit: 'WEEK',
    price: 250000,
    description:
      '상세 "비슷한 공고" 첫 카드. 지금 보는 공고와 같은 직무 카테고리의 상세에서만 노출되고 AD 라벨 + 역량 태그가 붙어요.',
    spec: '공고 링크 + 해석 한 줄 + 역량 태그',
    expectedCtr: '4 ~ 6%',
    couponEligible: true,
    visible: true,
  },
  {
    key: 'ACTIVE_EDU',
    name: '적극 모집중 공고 구좌',
    page: 'BOOTCAMP_LIST',
    target: 'BOOTCAMP',
    format: 'CARD',
    slotCount: 4,
    perJobField: false,
    rolling: false,
    unit: 'WEEK',
    price: 350000,
    description:
      '교육 리스트 최상단 "적극 모집중" 영역에 과정 카드 4개 노출. 교육기관 전용 지면이에요.',
    spec: '교육 공고 링크',
    expectedCtr: '2 ~ 3.5%',
    couponEligible: false,
    visible: true,
  },
  {
    key: 'MAIN_TOP_BANNER_EDU',
    name: '교육 상단 배너',
    page: 'BOOTCAMP_LIST',
    target: 'BOOTCAMP',
    format: 'BANNER',
    slotCount: 1,
    perJobField: false,
    rolling: false,
    unit: 'WEEK',
    price: 400000,
    description: '적극 모집중 아래 가로 배너. 국비지원·KDT 과정 모집 캠페인에 맞춰요.',
    spec: BANNER_SPEC,
    expectedCtr: '1 ~ 1.5%',
    couponEligible: false,
    visible: true,
  },
  {
    key: 'MAIN_BOTTOM_BANNER_EDU',
    name: '교육 하단 배너',
    page: 'BOOTCAMP_LIST',
    target: 'BOOTCAMP',
    format: 'BANNER',
    slotCount: 1,
    perJobField: false,
    rolling: false,
    unit: 'WEEK',
    price: 250000,
    description: '교육 리스트 끝 단독 배너.',
    spec: BANNER_SPEC,
    expectedCtr: '0.7 ~ 1.2%',
    couponEligible: false,
    visible: true,
  },
  {
    key: 'SIMILAR_TOP_EDU',
    name: '비슷한 교육 상단 노출',
    page: 'BOOTCAMP_DETAIL',
    target: 'BOOTCAMP',
    format: 'CARD',
    slotCount: 1,
    perJobField: true,
    rolling: false,
    unit: 'WEEK',
    price: 200000,
    description:
      '교육 상세 하단 "비슷한 교육" 첫 카드. 같은 직무 카테고리 과정 상세에서만 노출돼요.',
    spec: '교육 공고 링크',
    expectedCtr: '3 ~ 5%',
    couponEligible: false,
    visible: true,
  },
  {
    key: 'CALENDAR_TOP',
    name: '달력 상단 노출',
    page: 'JOB_CALENDAR',
    target: 'JOB',
    format: 'CALENDAR',
    slotCount: 4,
    perJobField: false,
    rolling: false,
    unit: 'POSTING_PERIOD',
    price: 200000,
    description:
      '일별·주차별 달력 모두 상단 "이번 주 주목 공고" 스트립에 로고 칩으로 노출되고, 마감일 셀은 포인트 테두리로 강조돼요. 우측 리스트 상단에도 고정돼요.',
    spec: '로고, 강조 색상',
    expectedCtr: '1.5 ~ 3%',
    couponEligible: false,
    visible: true,
  },
  {
    key: 'MY_DASHBOARD_SCRAP',
    name: '지원일정 대시보드 추천',
    page: 'MY_SCHEDULE',
    target: 'JOB',
    format: 'CARD',
    slotCount: 1,
    perJobField: false,
    rolling: true,
    unit: 'WEEK',
    price: 300000,
    description:
      '지원일정 관리 대시보드 상단에 추천 공고 1개. 스크랩 버튼을 누르면 자리에 새 광고가 노출돼요. 단계 탭을 옮길 때도 새 광고가 보여요.',
    spec: '공고 링크, 로고',
    expectedCtr: '2.5 ~ 4%',
    couponEligible: false,
    visible: true,
  },
];

/** 신청 가능 범위. 다음 주 월요일부터 12주. */
export const AD_BOOKABLE_WEEKS = 12;

/**
 * 앞 몇 기간의 잔여. 그 뒤는 비어 있다(잔여 = 슬롯 수). 직무별 구좌는 직무별로 따로 적고, 적지 않은 직무는 비어 있다.
 * A2·A4 의 직무별 값은 광고 시스템 시안 `PRODUCTS[].cats` 의 다섯 직무(마케팅/광고, HR/총무, 기획/전략, 영업, IT/개발) 그대로다.
 */
const REMAINING: Record<AdPlacementKey, number[] | Partial<Record<AdJobField, number[]>>> = {
  RECOMMEND_TOP_RECRUIT: [1, 0, 1, 1, 1],
  LIST_TOP_RECRUIT: {
    MARKETING_ADVERTISING: [1, 1, 0, 1, 1],
    HR_GENERAL_AFFAIRS: [1, 1, 1, 1, 1],
    PLANNING_STRATEGY: [0, 1, 1, 1, 1],
    SALES: [1, 1, 1, 1, 1],
    IT_DEVELOPMENT: [1, 0, 1, 1, 1],
  },
  ACTIVE_RECRUIT: [2, 1, 3, 4, 4],
  MAIN_TOP_BANNER_RECRUIT: [3, 0, 2, 4, 4],
  MAIN_BOTTOM_BANNER_RECRUIT: [0, 1, 1, 0, 1],
  SIMILAR_TOP_RECRUIT: {
    MARKETING_ADVERTISING: [1, 1, 1, 1, 1],
    HR_GENERAL_AFFAIRS: [1, 1, 1, 1, 1],
    PLANNING_STRATEGY: [0, 0, 0, 1, 1],
    SALES: [1, 1, 1, 1, 1],
    IT_DEVELOPMENT: [1, 1, 1, 1, 1],
  },
  ACTIVE_EDU: [2, 4, 0, 1, 4],
  MAIN_TOP_BANNER_EDU: [1, 0, 1, 1, 1],
  MAIN_BOTTOM_BANNER_EDU: [1, 1, 1, 1, 1],
  SIMILAR_TOP_EDU: { IT_DEVELOPMENT: [1, 0, 1, 1, 1] },
  // 월 단위. 시안 A6 `monthRem: 2`.
  CALENDAR_TOP: [2, 4, 4],
  MY_DASHBOARD_SCRAP: [0, 1, 1, 1, 1],
};

/** 공고 기간 단위 구좌가 보여 주는 달 수. 12주를 덮는다. */
const BOOKABLE_MONTHS = 3;

function periodsOf(placement: AdPlacement): { startDate: string; endDate: string }[] {
  const first = mondayAfter(1);
  if (placement.unit === 'POSTING_PERIOD') {
    return Array.from({ length: BOOKABLE_MONTHS }, (_, index) => {
      const start = new Date(first.getFullYear(), first.getMonth() + index, 1);
      const end = new Date(first.getFullYear(), first.getMonth() + index + 1, 0);
      return { startDate: ymd(start), endDate: ymd(end) };
    });
  }
  return Array.from({ length: AD_BOOKABLE_WEEKS }, (_, index) => {
    const start = plusDays(first, index * 7);
    return { startDate: ymd(start), endDate: ymd(plusDays(start, 6)) };
  });
}

/** 구좌별 기간 잔여. 직무별 구좌는 모든 직무를 기간마다 한 줄씩 낸다. */
export function buildAdAvailability(placements: AdPlacement[]): AdPlacementAvailabilityResponse[] {
  return placements.map((placement) => {
    const remaining = REMAINING[placement.key];
    const capacity = placement.slotCount;
    const periods: AdPlacementPeriodAvailability[] = [];
    periodsOf(placement).forEach((period, index) => {
      if (Array.isArray(remaining)) {
        periods.push({ ...period, capacity, remaining: remaining[index] ?? capacity });
        return;
      }
      for (const jobField of Object.values(CompanyJobSummaryResponseJobField)) {
        const values = remaining[jobField];
        periods.push({ ...period, jobField, capacity, remaining: values?.[index] ?? capacity });
      }
    });
    return { placement, periods };
  });
}

const COMPANY = '오공고 테스트 기업';

const CONTACT = {
  name: '김담당',
  phone: '010-0000-0000',
  email: 'company@example.com',
  companyName: COMPANY,
};

const BILLING = {
  contractEmail: 'company@example.com',
  taxInvoiceEmail: 'tax@example.com',
  taxInvoiceType: 'CLAIM',
} as const;

const BANNER_IMAGE_URL =
  'https://letsintern-bucket.s3.ap-northeast-2.amazonaws.com/images/work24/3e73c50619eb40de51e78fd8da445c1bb850fb2b.jpg';

/** 소재 검수 중. 오공고 제작 소재 둘이 광고주 확인을 기다린다. A4 에 쿠폰을 썼다. */
const reviewingReceivedAt = mondayAfter(-2);
const reviewingStart = mondayAfter(1);

/** 반려. 직접 올린 배너가 규격에 맞지 않고 공고에 급여가 없다. */
const rejectedReceivedAt = mondayAfter(-3);
const rejectedStart = mondayAfter(2);

/** 종료. 4주 전 한 주 집행했고 집계가 확정됐다. */
const endedReceivedAt = mondayAfter(-6);
const endedStart = mondayAfter(-4);
const endedEnd = plusDays(endedStart, 6);

export const AD_APPLICATION_FIXTURES: AdApplication[] = [
  {
    id: 27,
    applicationNo: applicationNo(reviewingReceivedAt, 27),
    status: 'REVIEWING',
    postTarget: 'JOB',
    postId: 112,
    postTitle: '[전환형 인턴] B2B AI Product Owner Intern',
    companyName: COMPANY,
    purpose: 'FIT_APPLICANTS',
    items: [
      {
        id: 2701,
        placementKey: 'LIST_TOP_RECRUIT',
        placementName: '리스트 상단 고정',
        jobField: 'PLANNING_STRATEGY',
        startDate: ymd(reviewingStart),
        endDate: ymd(plusDays(reviewingStart, 6)),
        weeks: 1,
        amount: 300000,
        couponApplied: false,
        creative: {
          id: 27011,
          source: 'OGONGGO_MADE',
          skillTags: ['문제 정의', 'MVP 기획', '데이터 분석'],
          taskTags: ['B2B 요구사항 분석', 'Product Roadmap'],
          confirmStatus: 'PENDING',
          uploadedAt: at(plusDays(reviewingReceivedAt, 7), '11:05'),
        },
      },
      {
        id: 2702,
        placementKey: 'SIMILAR_TOP_RECRUIT',
        placementName: '비슷한 공고 상단 노출',
        jobField: 'PLANNING_STRATEGY',
        startDate: ymd(reviewingStart),
        endDate: ymd(plusDays(reviewingStart, 6)),
        weeks: 1,
        amount: 250000,
        couponApplied: true,
        creative: {
          id: 27021,
          source: 'OGONGGO_MADE',
          headline: '첫 PO 커리어를 시작하고 싶다면',
          skillTags: ['문제 정의', 'MVP 기획', '데이터 분석'],
          taskTags: ['B2B 요구사항 분석', 'Product Roadmap'],
          confirmStatus: 'PENDING',
          uploadedAt: at(plusDays(reviewingReceivedAt, 7), '11:05'),
        },
      },
    ],
    amount: { subtotal: 550000, discount: 0, coupon: 250000, total: 300000 },
    paid: true,
    receivedAt: at(reviewingReceivedAt, '14:02'),
    contact: CONTACT,
    billing: BILLING,
    waitlist: 'SAME_PERIOD',
    memo: '사람인·원티드에 올리고 있는데 신입 지원자가 적어요',
    history: [
      {
        at: at(reviewingReceivedAt, '14:02'),
        message: `신청 접수 (${applicationNo(reviewingReceivedAt, 27)})`,
      },
      { at: at(plusDays(reviewingReceivedAt, 1), '10:30'), message: '견적서 발송 · ₩300,000' },
      {
        at: at(plusDays(reviewingReceivedAt, 2), '09:15'),
        message: '계약서 서명 완료 (모두싸인)',
      },
      {
        at: at(plusDays(reviewingReceivedAt, 4), '16:40'),
        message: '입금 확인 · 소재 검수 단계 진입',
      },
      {
        at: at(plusDays(reviewingReceivedAt, 7), '11:05'),
        message: '오공고 제작 소재 업로드 · 확인 요청',
      },
    ],
  },
  {
    id: 22,
    applicationNo: applicationNo(rejectedReceivedAt, 22),
    status: 'REVIEWING',
    rejection: {
      status: 'REVIEWING',
      reason: '배너 이미지 규격 불일치(1200×120 필요) · 근무 조건(급여) 미기재',
      rejectedAt: at(plusDays(rejectedReceivedAt, 8), '15:20'),
    },
    postTarget: 'JOB',
    postId: 110,
    postTitle: '서비스 운영 매니저 (계약직)',
    companyName: COMPANY,
    purpose: 'BRAND_AWARENESS',
    items: [
      {
        id: 2201,
        placementKey: 'MAIN_TOP_BANNER_RECRUIT',
        placementName: '메인 상단 배너',
        startDate: ymd(rejectedStart),
        endDate: ymd(plusDays(rejectedStart, 6)),
        weeks: 1,
        amount: 500000,
        couponApplied: false,
        creative: {
          id: 22011,
          source: 'UPLOADED',
          bannerImageUrlPc: BANNER_IMAGE_URL,
          bannerImageUrlMo: BANNER_IMAGE_URL,
          skillTags: ['고객 응대', '운영 프로세스'],
          taskTags: ['VOC 분류', '운영 지표 관리'],
          confirmStatus: 'APPROVED',
          rejectionReason: '배너 이미지 규격 불일치(1200×120 필요)',
          uploadedAt: at(plusDays(rejectedReceivedAt, 6), '10:00'),
        },
      },
    ],
    amount: { subtotal: 500000, discount: 0, coupon: 0, total: 500000 },
    paid: true,
    receivedAt: at(rejectedReceivedAt, '09:40'),
    contact: CONTACT,
    billing: BILLING,
    waitlist: 'NONE',
    history: [
      {
        at: at(rejectedReceivedAt, '09:40'),
        message: `신청 접수 (${applicationNo(rejectedReceivedAt, 22)})`,
      },
      { at: at(plusDays(rejectedReceivedAt, 1), '11:00'), message: '견적서 발송 · ₩500,000' },
      {
        at: at(plusDays(rejectedReceivedAt, 2), '13:10'),
        message: '계약서 서명 완료 (모두싸인)',
      },
      {
        at: at(plusDays(rejectedReceivedAt, 5), '17:00'),
        message: '입금 확인 · 소재 검수 단계 진입',
      },
      { at: at(plusDays(rejectedReceivedAt, 6), '10:00'), message: '광고주 배너 소재 업로드' },
      {
        at: at(plusDays(rejectedReceivedAt, 8), '15:20'),
        message: '검수 반려 · 배너 이미지 규격 불일치, 근무 조건(급여) 미기재',
      },
    ],
  },
  {
    id: 19,
    applicationNo: applicationNo(endedReceivedAt, 19),
    status: 'ENDED',
    postTarget: 'JOB',
    postId: 111,
    postTitle: '콘텐츠 마케팅 인턴 (체험형)',
    companyName: COMPANY,
    purpose: 'FAST_APPLICANTS',
    items: [
      {
        id: 1901,
        placementKey: 'LIST_TOP_RECRUIT',
        placementName: '리스트 상단 고정',
        jobField: 'MARKETING_ADVERTISING',
        startDate: ymd(endedStart),
        endDate: ymd(endedEnd),
        weeks: 1,
        amount: 300000,
        couponApplied: false,
        displayOrder: 1,
        creative: {
          id: 19011,
          source: 'OGONGGO_MADE',
          skillTags: ['콘텐츠 기획', 'SNS 운영'],
          taskTags: ['인스타그램 콘텐츠 제작'],
          confirmStatus: 'APPROVED',
          uploadedAt: at(plusDays(endedReceivedAt, 7), '10:00'),
        },
      },
      {
        id: 1902,
        placementKey: 'SIMILAR_TOP_RECRUIT',
        placementName: '비슷한 공고 상단 노출',
        jobField: 'MARKETING_ADVERTISING',
        startDate: ymd(endedStart),
        endDate: ymd(endedEnd),
        weeks: 1,
        amount: 250000,
        couponApplied: false,
        displayOrder: 1,
        creative: {
          id: 19021,
          source: 'OGONGGO_MADE',
          headline: '첫 인턴을 찾는 분께 추천',
          skillTags: ['콘텐츠 기획', 'SNS 운영'],
          taskTags: ['인스타그램 콘텐츠 제작'],
          confirmStatus: 'APPROVED',
          uploadedAt: at(plusDays(endedReceivedAt, 7), '10:00'),
        },
      },
    ],
    amount: { subtotal: 550000, discount: 0, coupon: 0, total: 550000 },
    paid: true,
    receivedAt: at(endedReceivedAt, '16:12'),
    contact: CONTACT,
    billing: BILLING,
    waitlist: 'NONE',
    history: [
      {
        at: at(endedReceivedAt, '16:12'),
        message: `신청 접수 (${applicationNo(endedReceivedAt, 19)})`,
      },
      { at: at(plusDays(endedReceivedAt, 1), '10:00'), message: '견적서 발송 · ₩550,000' },
      { at: at(plusDays(endedReceivedAt, 2), '14:30'), message: '계약서 서명 완료 (모두싸인)' },
      {
        at: at(plusDays(endedReceivedAt, 3), '11:20'),
        message: '입금 확인 · 소재 검수 단계 진입',
      },
      { at: at(plusDays(endedReceivedAt, 8), '15:00'), message: '소재 확인 완료 · 확정' },
      { at: at(endedStart, '00:00'), message: '집행 시작' },
      { at: at(plusDays(endedEnd, 1), '00:00'), message: '집행 종료' },
    ],
  },
];

const ENDED_DAILY = [
  [2100, 80, 9],
  [2700, 102, 12],
  [3050, 125, 15],
  [3200, 136, 16],
  [2850, 118, 21],
  [2500, 98, 14],
  [2020, 83, 9],
] as const;

/** 종료 신청(id 19)의 리포트. 시안 `rptCards`·`rptRows`·`insights` 의 숫자 그대로다. */
export const AD_REPORT_FIXTURES: AdReport[] = [
  {
    applicationId: 19,
    applicationNo: applicationNo(endedReceivedAt, 19),
    postTitle: '콘텐츠 마케팅 인턴 (체험형)',
    startDate: ymd(endedStart),
    endDate: ymd(endedEnd),
    finalizedAt: at(plusDays(endedEnd, 7), '00:00'),
    postDeadline: ymd(plusDays(endedStart, 5)),
    totals: {
      impressions: 18420,
      clicks: 742,
      ctr: 4.0,
      detailViews: 614,
      applyClicks: 96,
      scraps: 41,
      impressionsDiffFromJobFieldAverage: 12,
      generalCardAverageCtr: 3.1,
    },
    rows: [
      {
        itemId: 1901,
        placementKey: 'LIST_TOP_RECRUIT',
        placementName: '리스트 상단 고정',
        jobField: 'MARKETING_ADVERTISING',
        startDate: ymd(endedStart),
        endDate: ymd(endedEnd),
        impressions: 11230,
        clicks: 402,
        ctr: 3.6,
        detailViews: 318,
        applyClicks: 51,
        ctrDiffFromJobFieldAverage: 0.5,
      },
      {
        itemId: 1902,
        placementKey: 'SIMILAR_TOP_RECRUIT',
        placementName: '비슷한 공고 상단 노출',
        jobField: 'MARKETING_ADVERTISING',
        startDate: ymd(endedStart),
        endDate: ymd(endedEnd),
        impressions: 7190,
        clicks: 340,
        ctr: 4.7,
        detailViews: 296,
        applyClicks: 45,
        ctrDiffFromJobFieldAverage: 1.4,
      },
    ],
    daily: ENDED_DAILY.map(([impressions, clicks, applyClicks], index) => ({
      date: ymd(plusDays(endedStart, index)),
      impressions,
      clicks,
      applyClicks,
    })),
    reactions: { notInterested: 2, reports: 0 },
    insights: [
      '비슷한 공고 상단 노출의 클릭률이 4.7%로 가장 높았어요. 같은 직무 상세를 보던 취준생에게 노출된 효과예요.',
      '노출은 집행 3~4일차에 가장 많았고, 공고 마감 전날 지원 클릭이 하루 최다(21건)였어요.',
      '마케팅·광고 일반 카드 평균(3.1%)보다 0.9%p 높은 클릭률로, 다음 집행 시 오공고 추천 카드를 더하면 노출 폭을 넓힐 수 있어요.',
    ],
  },
];

/** 신규 기업회원 무료 쿠폰. A2 또는 A4 1주. id 27 신청에서 썼다. */
export const AD_COUPON_FIXTURES: AdCoupon[] = [
  {
    id: 1,
    name: '신규 기업회원 무료 쿠폰',
    placementKeys: ['LIST_TOP_RECRUIT', 'SIMILAR_TOP_RECRUIT'],
    weeks: 1,
    expiresAt: at(plusDays(mondayAfter(8), 6), '23:59'),
    usedAt: at(reviewingReceivedAt, '14:02'),
  },
  /**
   * 아직 쓰지 않은 쿠폰. 비즈니스 앱 신청서의 쿠폰 적용·0원 신청(계약 단계 생략)을 목으로 확인하려고 더했다
   * (`.claude/tasks/memos/결정-광고시스템-business-신청서-2026-11-03.md`).
   */
  {
    id: 2,
    name: '무료 홍보 쿠폰',
    placementKeys: ['LIST_TOP_RECRUIT', 'SIMILAR_TOP_RECRUIT'],
    weeks: 1,
    expiresAt: at(plusDays(mondayAfter(8), 6), '23:59'),
  },
];
