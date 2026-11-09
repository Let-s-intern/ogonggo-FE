import type { CreateAdvertisementContractRequest, MyAccountResponse } from '@ogonggo/api';

/**
 * 광고 신청서 값. 서버 요청(`CreateAdvertisementContractRequest`, ogonggo-BE user API)에 칸이 있는 값은 그 이름의
 * 의미대로, 칸이 없는 값(상품·희망 기간·모집 형태)은 `scheduleRequest` 텍스트로 합쳐 보낸다(`toRequest`).
 */
export type PromotionTarget = 'JOB' | 'BOOTCAMP';
export type Purpose = 'FAST_APPLICANTS' | 'FIT_APPLICANTS' | 'BRAND_AWARENESS';
export type InvoiceMethod = 'TAX_INVOICE' | 'NEGOTIATE';
export type CreativeMethod = 'REQUEST_PRODUCTION' | 'PROVIDE_DIRECTLY';
export type ProductCategory = CreateAdvertisementContractRequest['categories'][number];

export const RECRUIT_TYPES = ['기간 지정 모집', '채용 시 마감', '상시 모집'] as const;
export type RecruitType = (typeof RECRUIT_TYPES)[number];

export interface FormValues {
  target: PromotionTarget;
  companyName: string;
  title: string;
  url: string;
  /** `yyyy-MM-dd`. 서버가 필수로 받는다. */
  deadline: string;
  recruitType: RecruitType;
  purpose: Purpose;
  productIds: string[];
  /** 희망 집행 시작일 `yyyy-MM-dd`. */
  startDate: string | null;
  /** 희망 집행 종료일 `yyyy-MM-dd`. 시작일과 같으면 하루다. */
  endDate: string | null;
  scheduleNote: string;
  managerName: string;
  email: string;
  phone: string;
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
  recruitType: '기간 지정 모집',
  purpose: 'FAST_APPLICANTS',
  productIds: [],
  startDate: null,
  endDate: null,
  scheduleNote: '',
  managerName: '',
  email: '',
  phone: '',
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

export const PURPOSE_OPTIONS: { value: Purpose; label: string; hint: string }[] = [
  { value: 'FAST_APPLICANTS', label: '지원자 빠르게 확보', hint: '모집 기간 내 유입 확대' },
  { value: 'FIT_APPLICANTS', label: '적합한 지원자 확보', hint: '관심 직무·타겟 집중' },
  { value: 'BRAND_AWARENESS', label: '브랜드 인지도 확대', hint: '기업·프로그램 소개' },
];

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

export const SCHEDULE_NOTE_MAX = 1000;
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
 * 광고 신청서에서 고르는 상품 6개(2026-11-09 사용자: 오공고 웹 1 · 카카오톡 2 · 인스타그램 2 · 카카오톡 CRM 1). 오공고 웹의
 * 지면(배너·추천 카드 등)은 여기서 고르지 않고 담당자가 견적 때 정한다. 카카오톡·인스타 이미지는 web 커뮤니티 페이지
 * (`apps/web/public/community`)에서 `public/ad-products` 로 복사했고, 오공고 웹·CRM 은 랜딩(`public/landing`) 것을 쓴다.
 */
export type AdProductGroupId = 'web' | 'kakao' | 'instagram' | 'crm';

/** 화면에서 상품을 묶어 보이는 단위. 세로로 쌓아 어느 채널의 상품인지 바로 보이게 한다. */
export const AD_PRODUCT_GROUPS: { id: AdProductGroupId; title: string; reach: string }[] = [
  { id: 'web', title: '오공고 웹', reach: '지면광고' },
  { id: 'kakao', title: '카카오톡', reach: '누적 1만 5천명' },
  { id: 'instagram', title: '인스타그램', reach: '오공고 · 렛츠커리어 계정' },
  { id: 'crm', title: '카카오톡 CRM', reach: '약 2만명' },
];

export interface AdProduct {
  id: string;
  group: AdProductGroupId;
  /** 카드 위 작은 글씨. 계정·규모. */
  reach: string;
  title: string;
  description: string;
  /** 하나면 카드 전체, 여섯 장 이상이면 3열 격자(인스타 피드), 그 사이면 한 줄로 나란히 놓는다(오공고 웹 화면, 카카오톡 방). */
  images: string[];
  /** 이미지마다 붙일 화면 이름. 있으면 이미지 아래에 띄운다. */
  imageLabels?: string[];
  price: string;
  /**
   * 광고 신청 API 의 `categories` 값. 카카오톡 CRM 은 BE 카테고리가 아직 없어 비어 있고 `[희망 상품]` 글에만 남는다.
   * BE 는 카테고리를 하나 이상 요구해 CRM 만 고르면 받지 않는다(`validateStep`).
   */
  categories: ProductCategory[];
}

export const AD_PRODUCTS: AdProduct[] = [
  {
    id: 'ogonggo-web',
    group: 'web',
    reach: '채용공고 홈',
    title: '오늘의 공고 지면광고',
    description: '채용공고 홈의 추천 카드 · 상단 고정 · 배너 자리에 공고를 노출해요.',
    images: [
      '/landing/jobs-list.webp',
      '/landing/job-detail.webp',
      '/landing/bootcamps-list.webp',
      '/landing/calendar.webp',
      '/landing/mypage-scraps.webp',
    ],
    imageLabels: ['채용공고 홈', '공고 상세', '부트캠프', '공고 달력', '마이페이지'],
    price: '1주 30만원부터',
    categories: ['JOB_POSTING', 'BANNER'],
  },
  {
    id: 'kakao-curation',
    group: 'kakao',
    reach: '직무별 톡방 6개',
    title: '직무별 채용공고 큐레이션 톡방',
    description: '직무별 오픈채팅방 총 6개에 홍보글을 올려요.',
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
    images: ['/ad-products/chat-tip.jpg', '/ad-products/chat-info.jpg'],
    price: '견적 문의',
    categories: ['KAKAO_2'],
  },
  {
    id: 'instagram-ogonggo',
    group: 'instagram',
    reach: '@letscareer.job',
    title: '오공고 인스타그램',
    description: '오늘의 공고 계정의 피드 게시물 또는 스토리로 알려요.',
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
  {
    id: 'kakao-crm',
    group: 'crm',
    reach: '렛츠커리어 카카오 채널',
    title: '카카오톡 CRM',
    description: '렛츠커리어 카카오 채널 친구에게 메시지로 직접 보내요.',
    images: ['/landing/crm-dm-1.png'],
    price: '견적 문의',
    categories: [],
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
    const products = selectedProducts(v);
    if (products.length === 0) e.productIds = '광고 상품을 하나 이상 선택해 주세요.';
    else if (products.every((p) => p.categories.length === 0))
      e.productIds = '카카오톡 CRM은 다른 상품과 함께 신청해 주세요.';
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
    if (v.adRequest.length > AD_REQUEST_MAX)
      e.adRequest = `${AD_REQUEST_MAX}자 이하로 입력해 주세요.`;
  }
  if (step === 5) {
    if (!v.agreePrivacy || !v.agreeNotice) e.agree = '필수 항목에 동의해 주세요.';
  }
  return e;
}

/** 서버 요청 본문. 받을 칸이 없는 상품·기간·모집 형태는 담당자가 읽을 수 있게 `scheduleRequest` 에 적는다. */
export function toRequest(v: FormValues): CreateAdvertisementContractRequest {
  const products = selectedProducts(v);
  const categories = [...new Set(products.flatMap((p) => p.categories))];
  const lines = [
    `[희망 상품] ${products.map((p) => p.title).join(', ')}`,
    ...(v.startDate && v.endDate
      ? [`[희망 기간] ${v.startDate} ~ ${v.endDate} (${periodDays(v.startDate, v.endDate)}일)`]
      : []),
    `[모집 형태] ${v.recruitType}`,
    ...(v.scheduleNote.trim() ? [`[일정 요청] ${v.scheduleNote.trim()}`] : []),
  ];
  return {
    promotionTarget: v.target,
    companyName: v.companyName.trim(),
    recruitmentTitle: v.title.trim(),
    recruitmentUrl: v.url.trim(),
    recruitmentDeadline: v.deadline,
    purpose: v.purpose,
    categories,
    scheduleRequest: lines.join('\n'),
    advertisementRequest: v.adRequest.trim() || undefined,
    managerName: v.managerName.trim(),
    email: v.email.trim(),
    phoneNumber: v.phone.trim(),
    invoiceMethod: v.invoiceMethod,
    creativeMethod: v.creativeMethod,
  };
}
