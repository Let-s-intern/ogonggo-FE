import {
  type CreateAdvertisementContractRequest,
  enumOptions,
  type MyAccountResponse,
} from '@ogonggo/api';

/**
 * 광고 신청서 값. 서버 요청(`CreateAdvertisementContractRequest`, ogonggo-BE user API)에 칸이 있는 값은 그 이름의
 * 의미대로, 칸이 없는 값(원하는 구좌·희망 상품·희망 기간·모집 형태)은 `formAnswers` 로 보낸다(`toRequest`).
 */
export type PromotionTarget = 'JOB' | 'BOOTCAMP';
export type Purpose = 'FAST_APPLICANTS' | 'FIT_APPLICANTS' | 'BRAND_AWARENESS';
export type InvoiceMethod = 'TAX_INVOICE' | 'NEGOTIATE';
export type CreativeMethod = 'REQUEST_PRODUCTION' | 'PROVIDE_DIRECTLY';
export type ProductCategory = CreateAdvertisementContractRequest['categories'][number];
/** 사업자 번호 종류. 빈 문자열은 고르지 않은 것이다. 신청 API 는 번호를 선택으로 받는다. */
export type BusinessNumberType =
  | NonNullable<CreateAdvertisementContractRequest['businessNumberType']>
  | '';

export const RECRUIT_TYPES = ['기간 모집', '채용 시 마감', '상시 모집'] as const;
export type RecruitType = (typeof RECRUIT_TYPES)[number];

export interface FormValues {
  target: PromotionTarget;
  companyName: string;
  title: string;
  url: string;
  /** `yyyy-MM-dd`. 서버가 필수로 받는다. */
  deadline: string;
  recruitType: RecruitType;
  /** 홍보 목표를 누른 순서(우선순위)대로 둔다. 2단계에서 하나 이상 고른다. 첫째가 서버의 `purpose` 가 된다. */
  purposes: Purpose[];
  /** 원하는 광고 구좌를 적은 글. 비워도 된다. */
  desiredSlots: string;
  productIds: string[];
  /** 예정 예산 숫자. 비워도 된다. 소수점 둘째 자리까지 받고, `budgetUnit` 을 곱해 원으로 보낸다(`budgetAmountOf`). */
  budget: string;
  /** 예정 예산 단위(원). 숫자는 그대로 두고 단위만 바꿀 수 있다(2026-11-10 사용자). */
  budgetUnit: BudgetUnit;
  /** 희망 집행 시작일 `yyyy-MM-dd`. */
  startDate: string | null;
  /** 희망 집행 종료일 `yyyy-MM-dd`. 시작일과 같으면 하루다. */
  endDate: string | null;
  scheduleNote: string;
  managerName: string;
  email: string;
  phone: string;
  businessNumberType: BusinessNumberType;
  /** 화면에 보이는 값이다. 하이픈이 들어 있을 수 있고, 보낼 때 숫자만 남긴다. */
  businessNumber: string;
  invoiceMethod: InvoiceMethod;
  creativeMethod: CreativeMethod;
  adRequest: string;
  agreePrivacy: boolean;
  agreeNotice: boolean;
}

export const INITIAL_VALUES: FormValues = {
  target: 'JOB',
  companyName: '',
  title: '',
  url: '',
  deadline: '',
  recruitType: '기간 모집',
  purposes: [],
  desiredSlots: '',
  productIds: [],
  budget: '',
  budgetUnit: 10_000,
  startDate: null,
  endDate: null,
  scheduleNote: '',
  managerName: '',
  email: '',
  phone: '',
  businessNumberType: '',
  businessNumber: '',
  invoiceMethod: 'TAX_INVOICE',
  creativeMethod: 'REQUEST_PRODUCTION',
  adRequest: '',
  agreePrivacy: false,
  agreeNotice: false,
};

/**
 * 로그인한 기업 회원의 계정(`GET /api/v1/users/me`)에서 미리 채울 값. 기업 회원이 아니거나 값이 없는 칸은 뺀다.
 * 신청서에서 고칠 수 있다(PRD 7절).
 */
export function prefillFrom(account: MyAccountResponse): Partial<FormValues> {
  const profile = account.role === 'COMPANY' ? account.companyProfile : undefined;
  if (!profile) return {};
  const values: Partial<FormValues> = {
    companyName: profile.organizationName,
    managerName: profile.managerName,
    email: account.email,
    phone: profile.managerPhone,
    businessNumberType: profile.businessNumberType,
    businessNumber:
      profile.businessNumberType && profile.businessNumber
        ? formatBusinessNumber(profile.businessNumberType, profile.businessNumber)
        : undefined,
  };
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value),
  ) as Partial<FormValues>;
}

export const STEPS = ['공고 정보', '광고 상품', '집행 일정', '담당자 정보', '최종 확인'] as const;

export const TARGET_OPTIONS: { value: PromotionTarget; label: string; hint: string }[] = [
  { value: 'JOB', label: '채용 공고', hint: '신입·인턴·경력 채용' },
  { value: 'BOOTCAMP', label: '교육·부트캠프', hint: '교육과정 및 프로그램 모집' },
];

/** 2단계 홍보 목표. 문구는 영업팀이 정했다. 값은 서버의 `purpose` 그대로다. */
export const PURPOSE_OPTIONS: { value: Purpose; label: string }[] = [
  { value: 'BRAND_AWARENESS', label: '폭넓은 노출 확보' },
  { value: 'FIT_APPLICANTS', label: '관심 직무와 지원 조건에 맞는 취준생에게 집중적인 홍보' },
  { value: 'FAST_APPLICANTS', label: '실제 지원 페이지 유입과 신청 유도' },
];

export const purposeLabel = (value: Purpose) =>
  PURPOSE_OPTIONS.find((o) => o.value === value)?.label ?? value;

/** 순위마다 한 줄: `1순위 폭넓은 노출 확보` */
export const purposeRankLines = (purposes: Purpose[]) =>
  purposes.map((p, i) => `${i + 1}순위 ${purposeLabel(p)}`);

export const INVOICE_OPTIONS: { value: InvoiceMethod; label: string; hint: string }[] = [
  { value: 'TAX_INVOICE', label: '세금계산서 발행', hint: '사업자 정보는 추후 제출' },
  { value: 'NEGOTIATE', label: '담당자와 협의', hint: '신청 후 계약 방식 결정' },
];

export const CREATIVE_OPTIONS: { value: CreativeMethod; label: string; hint: string }[] = [
  {
    value: 'REQUEST_PRODUCTION',
    label: '공고 정보로 제작 요청',
    hint: '공고 내용을 기반으로 구성',
  },
  { value: 'PROVIDE_DIRECTLY', label: '직접 제작한 소재 제공', hint: '이미지·카피 별도 전달' },
];

/** 예정 예산 단위. 칩으로 고른다. */
export const BUDGET_UNITS = [
  { value: 10_000, label: '만원' },
  { value: 1_000_000, label: '100만원' },
  { value: 10_000_000, label: '1,000만원' },
] as const;
export type BudgetUnit = (typeof BUDGET_UNITS)[number]['value'];

/** 서버가 예산을 `int` 로 받아 넘지 못하는 값. */
export const BUDGET_MAX = 2_147_483_647;

/** 입력칸에 남길 글자. 숫자와 소수점 하나, 소수 둘째 자리까지다. */
export function sanitizeBudget(text: string): string {
  const [int = '', ...rest] = text.replace(/[^\d.]/g, '').split('.');
  return rest.length > 0 ? `${int}.${rest.join('').slice(0, 2)}` : int;
}

/** 적은 숫자에 단위를 곱한 원 금액. 비었거나 숫자가 아니면 없다. */
export function budgetAmountOf(v: Pick<FormValues, 'budget' | 'budgetUnit'>): number | undefined {
  const n = Number(v.budget);
  if (!v.budget || !Number.isFinite(n)) return undefined;
  return Math.round(n * v.budgetUnit);
}

/** `12,300,000원` 을 `1,230만원` 처럼, 억이 넘으면 `1억 2,000만원` 처럼 읽기 쉽게 쓴다. 만원 아래는 그대로 붙인다. */
export function formatWon(amount: number): string {
  const eok = Math.floor(amount / 1e8);
  const man = Math.floor((amount % 1e8) / 1e4);
  const won = amount % 1e4;
  const parts = [
    eok > 0 ? `${eok.toLocaleString('ko-KR')}억` : '',
    man > 0 ? `${man.toLocaleString('ko-KR')}만` : '',
    won > 0 ? won.toLocaleString('ko-KR') : '',
  ].filter(Boolean);
  return `${parts.join(' ') || '0'}원`;
}

/** 최종 확인에 쓰는 예정 예산. `200만원 (2,000,000원)`. */
export function budgetText(v: Pick<FormValues, 'budget' | 'budgetUnit'>): string {
  const amount = budgetAmountOf(v);
  return amount ? `${formatWon(amount)} (${amount.toLocaleString('ko-KR')}원)` : '입력 안 함';
}

/** 카탈로그 선택지. 순서는 백엔드 선언 순서 그대로다. */
export const BUSINESS_NUMBER_TYPE_OPTIONS = enumOptions('CompanyBusinessNumberType');

/** 번호 종류마다 숫자 자릿수. 백엔드 `CompanyBusinessNumberType.digitCount` 와 같다. 해외 기업은 번호가 없다. */
export const BUSINESS_NUMBER_DIGITS = {
  BUSINESS_REGISTRATION: 10,
  CORPORATE_REGISTRATION: 13,
  OVERSEAS: 0,
} as const satisfies Record<Exclude<BusinessNumberType, ''>, number>;

/**
 * 사업자 번호에 하이픈을 넣는다. 사업자등록번호는 3-2-5, 법인등록번호는 6-7 이다. 회원가입
 * (`apps/business/src/widgets/sign-up/companySignUp.ts` 의 `formatBusinessNumber`)과 같은 모양이다.
 */
export function formatBusinessNumber(type: BusinessNumberType, value: string): string {
  if (!type || type === 'OVERSEAS') return '';
  const digits = value.replace(/\D/g, '').slice(0, BUSINESS_NUMBER_DIGITS[type]);
  if (type === 'CORPORATE_REGISTRATION') {
    return digits.length <= 6 ? digits : `${digits.slice(0, 6)}-${digits.slice(6)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export const SCHEDULE_NOTE_MAX = 1000;
/** 서버의 `formAnswers[].value` 상한과 같다. */
export const DESIRED_SLOTS_MAX = 1000;
export const AD_REQUEST_MAX = 2000;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function parseYmd(ymd: string): Date {
  const [y = 0, m = 1, d = 1] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toYmd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** `2026. 12. 07.(월)` */
export function formatDate(ymd: string, withWeekday = false): string {
  const date = parseYmd(ymd);
  const text = `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(
    date.getDate(),
  ).padStart(2, '0')}.`;
  return withWeekday ? `${text}(${WEEKDAYS[date.getDay()]})` : text;
}

/** 시작일과 종료일을 모두 넣어 센 날 수. */
export function periodDays(startDate: string, endDate: string): number {
  return Math.round((parseYmd(endDate).getTime() - parseYmd(startDate).getTime()) / 86400000) + 1;
}

/**
 * 광고 신청서에서 고르는 상품(2026-11-10 사용자): 리스트 상단 노출 1 · 웹사이트 배너 2 · 카카오톡 2 · CRM 1 ·
 * 인스타그램 2. 오늘의 공고 화면은 랜딩(`public/landing`), 카카오톡·인스타 이미지는 web 커뮤니티 페이지에서 복사한
 * `public/ad-products`, CRM 은 렛츠커리어 채널 메시지 캡처(2026-11-09 사용자 제공)를 쓴다.
 */
export type AdProductGroupId = 'list-top' | 'web-banner' | 'kakao' | 'crm' | 'instagram';

/** 화면에서 상품을 묶어 보이는 단위. 세로로 쌓아 어느 채널의 상품인지 바로 보이게 한다. */
export const AD_PRODUCT_GROUPS: { id: AdProductGroupId; title: string; reach: string }[] = [
  {
    id: 'list-top',
    title: '오늘의 공고 리스트 상단 노출',
    reach: '리스트 · 마이페이지 · 공고 달력',
  },
  { id: 'web-banner', title: '웹사이트 지면 광고', reach: '렛츠커리어 · 오늘의 공고 배너' },
  { id: 'kakao', title: '카카오톡', reach: '누적 1만 5천명' },
  // CRM 은 카카오톡 오픈채팅과 다른 상품이라 따로 묶는다(2026-11-10 사용자).
  { id: 'crm', title: 'CRM', reach: '약 2만명' },
  { id: 'instagram', title: '인스타그램', reach: '오늘의 공고 · 렛츠커리어 계정' },
];

export interface AdProduct {
  id: string;
  group: AdProductGroupId;
  /** 카드 위 작은 글씨. 계정·규모. */
  reach: string;
  title: string;
  description: string;
  /** 언제 고르면 좋은지. 카드 아래 `이럴 때 추천` 으로 보인다. */
  recommend: string;
  /** 하나면 카드 전체, 여섯 장 이상이면 3열 격자(인스타 피드), 그 사이면 한 줄로 나란히 놓는다. */
  images: string[];
  /** 묶음 안에서 한 줄을 다 쓴다. 혼자인 묶음에 쓴다. */
  wide?: boolean;
  /** 이미지마다 붙일 화면 이름. 있으면 이미지 아래에 띄운다. */
  imageLabels?: string[];
  price: string;
  /**
   * 광고 신청 API 의 `categories` 값. 렛츠커리어 배너는 맞는 값이 없어 `BANNER` 로 보낸다. 어느 배너인지는
   * `formAnswers` 의 `희망 상품` 으로 구분된다.
   */
  categories: ProductCategory[];
}

export const AD_PRODUCTS: AdProduct[] = [
  {
    id: 'ogonggo-list-top',
    group: 'list-top',
    wide: true,
    reach: '채용공고 리스트 · 마이페이지 · 공고 달력',
    title: '오늘의 공고 리스트 상단 노출',
    description: '공고 리스트, 마이페이지 스크랩 칸, 공고 달력의 맨 앞에 공고 카드로 노출돼요.',
    recommend: '지원할 공고를 찾고 있는 취준생에게 우리 공고를 가장 먼저 보여주고 싶을 때 좋아요.',
    images: ['/landing/jobs-list.webp', '/landing/mypage-scraps.webp', '/landing/calendar.webp'],
    imageLabels: ['공고 리스트', '마이페이지', '공고 달력'],
    price: '1주 30만원부터',
    categories: ['JOB_POSTING'],
  },
  {
    id: 'letscareer-banner',
    group: 'web-banner',
    reach: '렛츠커리어 홈페이지 메인',
    title: '렛츠커리어 배너',
    description: '렛츠커리어 홈페이지 메인 상단 배너에 노출돼요.',
    recommend: '교육 프로그램이나 회사 브랜드를 취업 준비생에게 폭넓게 알리고 싶을 때 좋아요.',
    images: ['/landing/web-banner-1.png', '/landing/web-banner-2.png'],
    price: '견적 문의',
    categories: ['BANNER'],
  },
  {
    id: 'ogonggo-banner',
    group: 'web-banner',
    reach: '채용공고 홈 · 공고 상세 · 부트캠프',
    title: '오늘의 공고 배너',
    description: '오늘의 공고 채용공고 홈, 공고 상세, 부트캠프 목록의 배너 자리에 노출돼요.',
    recommend: '채용 캠페인이나 모집 소식을 이미지로 눈에 띄게 알리고 싶을 때 좋아요.',
    images: ['/landing/jobs-list.webp', '/landing/job-detail.webp'],
    imageLabels: ['채용공고 홈', '공고 상세'],
    price: '1주 30만원부터',
    categories: ['BANNER'],
  },
  {
    id: 'kakao-curation',
    group: 'kakao',
    reach: '직무별 톡방 총 6개',
    title: '직무별 채용공고 큐레이션 톡방',
    description: '직무별 오픈채팅방 총 6개에 홍보글을 올려요.',
    recommend: '특정 직무의 인재를 찾고 있어, 그 직무를 준비하는 분들께 바로 닿고 싶을 때 좋아요.',
    images: ['/ad-products/chat-job.jpg', '/ad-products/chat-hr.jpg'],
    price: '견적 문의',
    categories: ['KAKAO_1'],
  },
  {
    id: 'kakao-official',
    group: 'kakao',
    reach: '쥬디 톡방 · 무료 세미나방 등',
    title: '렛츠커리어 공식 오픈채팅방',
    description: '렛츠커리어가 운영하는 공식 오픈채팅방에 홍보글을 올려요.',
    recommend: '채용설명회나 교육처럼 직무와 관계없이 많은 참여자를 모으고 싶을 때 좋아요.',
    images: ['/ad-products/chat-tip.jpg', '/ad-products/chat-info.jpg'],
    price: '견적 문의',
    categories: ['KAKAO_2'],
  },
  {
    id: 'crm',
    group: 'crm',
    wide: true,
    reach: '마케팅 수신 동의 유저',
    title: '카카오톡 CRM · MMS · 뉴스레터',
    description:
      '마케팅 수신에 동의한 렛츠커리어 유저에게 카카오톡 채널 메시지, MMS, 뉴스레터로 직접 보내요.',
    recommend: '마감이 얼마 남지 않아 짧은 기간에 많은 분께 확실히 알려야 할 때 좋아요.',
    images: [
      '/ad-products/kakao-crm-1.jpg',
      '/ad-products/kakao-crm-2.jpg',
      '/ad-products/kakao-crm-3.jpg',
      '/ad-products/kakao-crm-4.jpg',
    ],
    price: '견적 문의',
    categories: ['KAKAO_CRM'],
  },
  {
    id: 'instagram-ogonggo',
    group: 'instagram',
    reach: '@letscareer.job',
    title: '오늘의 공고 인스타그램',
    description: '오늘의 공고 계정의 피드 게시물 또는 스토리로 알려요.',
    recommend: '채용·교육 소식을 챙겨 보는 팔로워에게 콘텐츠로 자연스럽게 소개하고 싶을 때 좋아요.',
    images: [
      '/ad-products/instagram-job-1.jpg',
      '/ad-products/instagram-job-2.jpg',
      '/ad-products/instagram-job-3.jpg',
      '/ad-products/instagram-job-4.jpg',
      '/ad-products/instagram-job-5.jpg',
      '/ad-products/instagram-job-6.jpg',
    ],
    price: '견적 문의',
    categories: ['INSTAGRAM_1'],
  },
  {
    id: 'instagram-letscareer',
    group: 'instagram',
    reach: '@letscareer.official',
    title: '렛츠커리어 인스타그램',
    description: '렛츠커리어 메인 계정의 피드 게시물 또는 스토리로 알려요.',
    recommend: '취업을 준비하는 많은 팔로워에게 회사와 브랜드를 알리고 싶을 때 좋아요.',
    images: [
      '/ad-products/instagram-official-1.jpg',
      '/ad-products/instagram-official-2.jpg',
      '/ad-products/instagram-official-3.jpg',
      '/ad-products/instagram-official-4.jpg',
      '/ad-products/instagram-official-5.jpg',
      '/ad-products/instagram-official-6.jpg',
    ],
    price: '견적 문의',
    categories: ['INSTAGRAM_2'],
  },
];

/** 고른 상품. 화면 순서대로 돌려준다. */
export function selectedProducts(values: FormValues): AdProduct[] {
  return AD_PRODUCTS.filter((p) => values.productIds.includes(p.id));
}

export function periodText(values: FormValues): string | null {
  const { startDate, endDate } = values;
  if (!startDate || !endDate) return null;
  return `${formatDate(startDate, true)} – ${formatDate(endDate, true)} · ${periodDays(startDate, endDate)}일`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/\S+\.\S+/i;
const PHONE_PATTERN = /^[0-9-+() ]{9,20}$/;

/** 단계별 검사. 비어 있으면 통과다. 값의 상한은 서버 요청의 `@Size` 와 같다. */
export function validateStep(step: number, v: FormValues): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 1) {
    if (!v.companyName.trim()) e.companyName = '기업명을 입력해 주세요.';
    else if (v.companyName.trim().length > 150) e.companyName = '150자 이하로 입력해 주세요.';
    if (!v.title.trim()) e.title = '공고명을 입력해 주세요.';
    else if (v.title.trim().length > 255) e.title = '255자 이하로 입력해 주세요.';
    if (!URL_PATTERN.test(v.url.trim()))
      e.url = 'http:// 또는 https:// 로 시작하는 링크를 입력해 주세요.';
    else if (v.url.trim().length > 2000) e.url = '링크가 너무 길어요.';
    if (!v.deadline) e.deadline = '모집 마감일을 선택해 주세요.';
  }
  if (step === 2) {
    if (!v.purposes.length) e.purpose = '홍보 목표를 선택해 주세요.';
    if (v.desiredSlots.length > DESIRED_SLOTS_MAX)
      e.desiredSlots = `${DESIRED_SLOTS_MAX}자 이하로 입력해 주세요.`;
    const amount = budgetAmountOf(v);
    if (v.budget && (amount === undefined || amount < 1))
      e.budget = '0보다 큰 금액을 입력해 주세요.';
    else if (amount !== undefined && amount > BUDGET_MAX) e.budget = '21억원 이하로 입력해 주세요.';
  }
  if (step === 3) {
    if (!v.startDate || !v.endDate) e.period = '집행 시작일과 종료일을 선택해 주세요.';
    if (v.scheduleNote.length > SCHEDULE_NOTE_MAX)
      e.scheduleNote = `${SCHEDULE_NOTE_MAX}자 이하로 입력해 주세요.`;
  }
  if (step === 4) {
    if (!v.managerName.trim()) e.managerName = '담당자 성함을 입력해 주세요.';
    else if (v.managerName.trim().length > 50) e.managerName = '50자 이하로 입력해 주세요.';
    if (!EMAIL_PATTERN.test(v.email.trim())) e.email = '이메일 형식을 확인해 주세요.';
    if (!PHONE_PATTERN.test(v.phone.trim())) e.phone = '연락처를 확인해 주세요.';
    if (v.businessNumberType && v.businessNumberType !== 'OVERSEAS') {
      const expected = BUSINESS_NUMBER_DIGITS[v.businessNumberType];
      if (digitsOf(v.businessNumber).length !== expected) {
        const name = BUSINESS_NUMBER_TYPE_OPTIONS.find(
          (o) => o.value === v.businessNumberType,
        )?.label;
        e.businessNumber = `${name}는 숫자 ${expected}자리입니다.`;
      }
    }
    if (v.adRequest.length > AD_REQUEST_MAX)
      e.adRequest = `${AD_REQUEST_MAX}자 이하로 입력해 주세요.`;
  }
  if (step === 5) {
    if (!v.agreePrivacy || !v.agreeNotice) e.agree = '필수 항목에 동의해 주세요.';
  }
  return e;
}

const digitsOf = (value: string) => value.replace(/\D/g, '');

/**
 * 서버 요청 본문. 받을 칸이 없는 답은 `formAnswers` 에 화면 순서대로, 답한 것만 담는다. `label` 이 어드민 상세와
 * 영업 Slack 에 그대로 보인다. `scheduleRequest` 에는 일정 요청 메모만 담는다.
 */
export function toRequest(v: FormValues): CreateAdvertisementContractRequest {
  const products = selectedProducts(v);
  const categories = [...new Set(products.flatMap((p) => p.categories))];
  const answers: [key: string, label: string, value: string][] = [
    // `purpose` 는 1순위 하나라 서버 enum 문구로만 보인다. 영업팀 문구와 순위를 보이려고 늘 싣는다.
    // 어드민·내 신청 상세가 이 key 로 찾아 홍보 목표 칸에 보인다.
    ['purposePriority', '홍보 목표 우선순위', purposeRankLines(v.purposes).join('\n')],
    ['desiredSlots', '원하는 구좌', v.desiredSlots.trim()],
    ['desiredProducts', '희망 상품', products.map((p) => p.title).join(', ')],
    [
      'desiredPeriod',
      '희망 기간',
      v.startDate && v.endDate
        ? `${v.startDate} ~ ${v.endDate} (${periodDays(v.startDate, v.endDate)}일)`
        : '',
    ],
    ['recruitType', '모집 형태', v.recruitType],
  ];
  const formAnswers = answers
    .filter(([, , value]) => value)
    .map(([key, label, value]) => ({ key, label, value }));
  return {
    promotionTarget: v.target,
    companyName: v.companyName.trim(),
    recruitmentTitle: v.title.trim(),
    recruitmentUrl: v.url.trim(),
    recruitmentDeadline: v.deadline,
    // 2단계 검사(`validateStep`)를 지나야 여기에 온다.
    purpose: v.purposes[0]!,
    budgetAmount: budgetAmountOf(v),
    categories,
    scheduleRequest: v.scheduleNote.trim() || undefined,
    advertisementRequest: v.adRequest.trim() || undefined,
    managerName: v.managerName.trim(),
    email: v.email.trim(),
    phoneNumber: v.phone.trim(),
    businessNumberType: v.businessNumberType || undefined,
    businessNumber:
      v.businessNumberType && v.businessNumberType !== 'OVERSEAS'
        ? digitsOf(v.businessNumber)
        : undefined,
    invoiceMethod: v.invoiceMethod,
    creativeMethod: v.creativeMethod,
    formAnswers,
  };
}
