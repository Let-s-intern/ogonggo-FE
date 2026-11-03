import type { CompanyJobSummaryResponseJobField } from '../../generated/user/models/companyJobSummaryResponseJobField';

/**
 * 광고 시스템(구좌, 광고 신청, 신청 항목, 소재, 이력, 쿠폰, 성과)의 목 전용 타입.
 *
 * 백엔드에 대응하는 API 가 아직 없다. 이 타입이 목 핸들러의 요청·응답 모양이고, 그대로 백엔드 요청서
 * (`.claude/tasks/memos/백엔드-요청-광고-시스템.md`)에 옮긴다. 백엔드가 생기면 생성 모델로 바꾸고 이 파일은 지운다.
 *
 * 날짜는 `yyyy-MM-dd`, 시각은 `yyyy-MM-ddTHH:mm:ss`(시간대 없음, KST) 다. 금액은 원 단위 정수이고 VAT 별도다.
 */

export type AdJobField = CompanyJobSummaryResponseJobField;

/**
 * 구좌 키. PRD `지면 상품` 결정: 기업서비스 시안의 페이지별 구좌에 리스트 상단 고정(A2)과 A1 추천 카드를 더하고,
 * 달력 하이라이트(A6)는 `CALENDAR_TOP` 에 합친다. 지원일정 대시보드 광고는 `MY_DASHBOARD_SCRAP` 이다.
 *
 * 시안 키(`active_recruit`)를 백엔드 enum 관례대로 대문자로 쓴다.
 */
export type AdPlacementKey =
  /** A1 오공고 추천 카드. 채용공고 홈 추천 캐러셀 1번 */
  | 'RECOMMEND_TOP_RECRUIT'
  /** A2 리스트 상단 고정. 직무 탭 리스트 1번, 2페이지부터 비노출 */
  | 'LIST_TOP_RECRUIT'
  | 'ACTIVE_RECRUIT'
  /** A3 리스트 배너와 같은 자리 */
  | 'MAIN_TOP_BANNER_RECRUIT'
  | 'MAIN_BOTTOM_BANNER_RECRUIT'
  /** A4 상세 추천 카드와 같은 자리. 비슷한 공고 첫 자리 고정 */
  | 'SIMILAR_TOP_RECRUIT'
  /** E1 교육 상단 고정과 같은 자리 */
  | 'ACTIVE_EDU'
  | 'MAIN_TOP_BANNER_EDU'
  | 'MAIN_BOTTOM_BANNER_EDU'
  | 'SIMILAR_TOP_EDU'
  /** A6 달력 하이라이트를 합친 자리 */
  | 'CALENDAR_TOP'
  | 'MY_DASHBOARD_SCRAP';

/** 구좌가 놓인 화면. */
export type AdPlacementPage =
  | 'JOB_LIST'
  | 'JOB_DETAIL'
  | 'BOOTCAMP_LIST'
  | 'BOOTCAMP_DETAIL'
  | 'JOB_CALENDAR'
  | 'MY_SCHEDULE';

/** 광고하는 공고 종류. 교육 구좌는 부트캠프만 받는다. */
export type AdTargetType = 'JOB' | 'BOOTCAMP';

/** `CARD` 는 공고 카드 자동 구성, `BANNER` 는 이미지 소재, `CALENDAR` 는 로고 칩과 강조 테두리. */
export type AdPlacementFormat = 'CARD' | 'BANNER' | 'CALENDAR';

/** 판매 단위. `WEEK` 는 월~일 한 주, `POSTING_PERIOD` 는 공고 기간 내내(월 단위 슬롯). */
export type AdPlacementUnit = 'WEEK' | 'POSTING_PERIOD';

export interface AdPlacement {
  key: AdPlacementKey;
  name: string;
  page: AdPlacementPage;
  target: AdTargetType;
  format: AdPlacementFormat;
  /** 한 기간(주 또는 월)에 넣을 수 있는 광고 수. 직무별 구좌면 직무 하나당 수다. */
  slotCount: number;
  /** 직무별로 슬롯이 따로 있는지. */
  perJobField: boolean;
  /** 슬롯 여럿이 새로고침마다 번갈아 보이는지. */
  rolling: boolean;
  unit: AdPlacementUnit;
  /** 정가. VAT 별도, 단위 하나(1주 또는 공고 기간) 기준. */
  price: number;
  description: string;
  /** 소재 규격. 예: `PC 1200×120 · MO 750×200`. */
  spec: string;
  /** 예상 클릭률 범위 문구. 예: `3 ~ 5%`. */
  expectedCtr: string;
  /** 무료 쿠폰을 쓸 수 있는 구좌인지. */
  couponEligible: boolean;
  /** 판매·노출 여부. 어드민이 끈다. */
  visible: boolean;
}

/** 구좌 × 기간(× 직무) 하나의 잔여. 광고주명과 금액은 담지 않는다(비로그인 공개). */
export interface AdPlacementPeriodAvailability {
  /** 주 단위면 월요일, 공고 기간 단위면 그 달 1일. */
  startDate: string;
  /** 주 단위면 일요일, 공고 기간 단위면 그 달 말일. */
  endDate: string;
  /** 직무별 구좌일 때만 있다. */
  jobField?: AdJobField;
  capacity: number;
  remaining: number;
}

export interface AdPlacementAvailabilityResponse {
  placement: AdPlacement;
  periods: AdPlacementPeriodAvailability[];
}

/**
 * 광고 진행 단계. 시안의 여덟 칸 `접수 → 견적 → (빈 칸) → 입금 → 검수 → 확정 → 집행 → 종료` 순서다.
 * 세 번째 칸은 이력 예시로 보아 `계약`(`CONTRACTED`) 으로 둔다(PRD `결정 필요` 8).
 * 반려는 단계가 아니다. 단계는 그대로 두고 `AdApplication.rejection` 이 채워진다.
 */
export type AdApplicationStatus =
  | 'RECEIVED'
  | 'QUOTED'
  | 'CONTRACTED'
  | 'PAID'
  | 'REVIEWING'
  | 'CONFIRMED'
  | 'RUNNING'
  | 'ENDED';

/** 광고 목적. 지원자 빨리 모으기(A2+A6), 적합한 지원자 찾기(A4+A1), 기업 알리기(A3). */
export type AdPurpose = 'FAST_APPLICANTS' | 'FIT_APPLICANTS' | 'BRAND_AWARENESS';

/** 잔여가 없을 때 대기. 대기 안 함 / 같은 기간 취소 시 연락 / 다른 기간이어도 연락. */
export type AdWaitlistOption = 'NONE' | 'SAME_PERIOD' | 'ANY_PERIOD';

/** 세금계산서 종류. 청구 / 영수. */
export type AdTaxInvoiceType = 'CLAIM' | 'RECEIPT';

/** 소재 준비 방식. 오공고 제작 요청(48시간) 또는 직접 업로드(배너만). */
export type AdCreativeSource = 'OGONGGO_MADE' | 'UPLOADED';

/** 광고주 확인 상태. 오공고가 올리면 `PENDING`, 광고주가 `이대로 게재` 하면 `APPROVED`, `수정 요청` 하면 `REVISION_REQUESTED`. */
export type AdCreativeConfirmStatus = 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED';

export interface AdContact {
  name: string;
  phone: string;
  email: string;
  companyName: string;
}

/** 계약·세금계산서 정보. 쿠폰만 쓰는 0원 신청은 없다. */
export interface AdBilling {
  /** 계약서(모두싸인) 수신 이메일. */
  contractEmail: string;
  taxInvoiceEmail: string;
  taxInvoiceType: AdTaxInvoiceType;
}

export interface AdCreative {
  id: number;
  source: AdCreativeSource;
  /** 배너 소재. `BANNER` 구좌만 있다. */
  bannerImageUrlPc?: string;
  bannerImageUrlMo?: string;
  /** 해석 한 줄. 40자 이하, A1·A4 자리만 쓴다. */
  headline?: string;
  /** 필수 역량 키워드. 최대 5. */
  skillTags: string[];
  /** 상세 수행 Task. 최대 5. */
  taskTags: string[];
  confirmStatus: AdCreativeConfirmStatus;
  /** 광고주가 수정 요청할 때 남긴 말. */
  revisionRequest?: string;
  /** 검수 반려 사유. */
  rejectionReason?: string;
  uploadedAt?: string;
}

/** 신청 항목. 신청 하나에 여럿이고, 구좌 하나 × 시작 기간 하나다. */
export interface AdApplicationItem {
  id: number;
  placementKey: AdPlacementKey;
  placementName: string;
  /** 직무별 구좌일 때만 있다. */
  jobField?: AdJobField;
  /** 시작 주의 월요일. 공고 기간 단위면 공고 게시 시작일. */
  startDate: string;
  endDate: string;
  /** 연속 집행 주 수(1~4). 공고 기간 단위면 1. */
  weeks: number;
  /** 정가 × 주 수. */
  amount: number;
  /** 무료 쿠폰을 이 항목에 썼는지. */
  couponApplied: boolean;
  /** 어드민이 확정·배치한 뒤 구좌 안 노출 순서(1부터). 확정 전에는 없다. */
  displayOrder?: number;
  creative: AdCreative;
}

export interface AdHistory {
  at: string;
  message: string;
}

export interface AdRejection {
  /** 반려가 난 단계. 시안은 `REVIEWING` 칸을 빨갛게 바꾼다. */
  status: AdApplicationStatus;
  reason: string;
  rejectedAt: string;
}

export interface AdAmount {
  subtotal: number;
  /** 3개 이상 묶음 할인(10%). */
  discount: number;
  coupon: number;
  total: number;
}

/** 목록 카드 한 장. */
export interface AdApplicationSummary {
  id: number;
  /** `AD-YYMMDD-NNNN`. */
  applicationNo: string;
  status: AdApplicationStatus;
  rejection?: AdRejection;
  postTarget: AdTargetType;
  postId: number;
  postTitle: string;
  companyName: string;
  items: Pick<
    AdApplicationItem,
    'id' | 'placementKey' | 'placementName' | 'jobField' | 'startDate' | 'endDate' | 'couponApplied'
  >[];
  amount: AdAmount;
  /** 입금 확인 여부. 목록 금액 줄에 `입금 확인됨` 이 붙는다. */
  paid: boolean;
  receivedAt: string;
}

export interface AdApplication extends Omit<AdApplicationSummary, 'items'> {
  purpose: AdPurpose;
  items: AdApplicationItem[];
  contact: AdContact;
  billing?: AdBilling;
  waitlist: AdWaitlistOption;
  /** 현재 홍보 중인 플랫폼과 어려웠던 점(선택). */
  memo?: string;
  history: AdHistory[];
}

/** 광고 신청 생성 요청. 기업회원으로 로그인한 상태다(비회원은 신청 3단계에서 가입한다). */
export interface CreateAdApplicationRequest {
  postTarget: AdTargetType;
  postId: number;
  purpose: AdPurpose;
  items: {
    placementKey: AdPlacementKey;
    jobField?: AdJobField;
    startDate: string;
    weeks: number;
  }[];
  /** 쓸 쿠폰. 쿠폰 대상 구좌 첫 항목에 적용한다. */
  couponId?: number;
  contact: AdContact;
  /** 쿠폰만 쓰는 0원 신청이면 비운다. */
  billing?: AdBilling;
  waitlist: AdWaitlistOption;
  creative: {
    source: AdCreativeSource;
    headline?: string;
    skillTags: string[];
    taskTags: string[];
    /** 직접 업로드일 때 이미지 업로드(`POST /api/v1/images`)로 받은 주소. */
    bannerImageUrlPc?: string;
    bannerImageUrlMo?: string;
  };
  memo?: string;
  privacyAgreed: boolean;
  policyAgreed: boolean;
}

export interface CreateAdApplicationResponse {
  id: number;
  applicationNo: string;
}

export interface RequestAdCreativeRevisionRequest {
  message: string;
}

export interface AdCoupon {
  id: number;
  name: string;
  /** 쓸 수 있는 구좌. */
  placementKeys: AdPlacementKey[];
  /** 쓸 수 있는 주 수. */
  weeks: number;
  expiresAt: string;
  usedAt?: string;
}

/** 구좌별 노출용 광고 한 건. 취준생 화면이 구좌 자리에 그린다. */
export interface AdExposure {
  itemId: number;
  placementKey: AdPlacementKey;
  displayOrder: number;
  target: AdTargetType;
  postId: number;
  postTitle: string;
  companyName: string;
  companyLogoUrl?: string;
  jobField?: AdJobField;
  headline?: string;
  skillTags: string[];
  bannerImageUrlPc?: string;
  bannerImageUrlMo?: string;
}

export interface AdReportTotals {
  impressions: number;
  clicks: number;
  /** 클릭률(%). 소수 첫째 자리. */
  ctr: number;
  detailViews: number;
  applyClicks: number;
  scraps: number;
  /** 같은 직무 광고 평균 대비 노출 증감(%). */
  impressionsDiffFromJobFieldAverage: number;
  /** 일반 카드 평균 클릭률(%). */
  generalCardAverageCtr: number;
}

export interface AdReportItemRow {
  itemId: number;
  placementKey: AdPlacementKey;
  placementName: string;
  jobField?: AdJobField;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  detailViews: number;
  applyClicks: number;
  /** 직무 평균 대비 클릭률 차이(%p). */
  ctrDiffFromJobFieldAverage: number;
}

export interface AdReportDaily {
  date: string;
  impressions: number;
  clicks: number;
  applyClicks: number;
}

export interface AdReport {
  applicationId: number;
  applicationNo: string;
  postTitle: string;
  startDate: string;
  endDate: string;
  /** 집계 확정 시각. 종료 D+7. */
  finalizedAt: string;
  /** 공고 마감일. 일별 추이에 선으로 긋는다. */
  postDeadline?: string;
  totals: AdReportTotals;
  rows: AdReportItemRow[];
  daily: AdReportDaily[];
  reactions: { notInterested: number; reports: number };
  insights: string[];
}

/** 어드민 구좌 설정의 한 줄. 구좌 안에 들어간 광고 항목이다. */
export interface AdminAdPlacementAssignment {
  itemId: number;
  applicationId: number;
  applicationNo: string;
  companyName: string;
  postTitle: string;
  jobField?: AdJobField;
  startDate: string;
  endDate: string;
  displayOrder: number;
  status: AdApplicationStatus;
}

export interface AdminAdPlacementSetting {
  placement: AdPlacement;
  assignments: AdminAdPlacementAssignment[];
}

/** 구좌 설정 수정. 보낸 칸만 바꾼다. */
export interface UpdateAdminAdPlacementRequest {
  name?: string;
  slotCount?: number;
  price?: number;
  visible?: boolean;
}

/** 구좌 안 노출 순서 변경. 그 구좌의 항목 id 전부를 원하는 순서로 보낸다. */
export interface ReorderAdminAdPlacementRequest {
  itemIds: number[];
}

/** 신청 상태 변경. `rejectionReason` 이 있으면 지금 단계에서 반려한다. */
export interface UpdateAdminAdApplicationStatusRequest {
  status: AdApplicationStatus;
  rejectionReason?: string;
}
