import type { CreateAdvertisementContractRequest, MyAccountResponse } from '@ogonggo/api';
import { PLACEMENTS } from '@/widgets/landing/content';

/**
 * 광고 신청서 값. 서버 요청(`CreateAdvertisementContractRequest`, ogonggo-BE user API)에 칸이 있는 값은 그 이름의
 * 의미대로, 칸이 없는 값(상품·희망 기간·모집 형태)은 `scheduleRequest` 텍스트로 합쳐 보낸다(`toRequest`).
 */
export type PromotionTarget = 'JOB' | 'BOOTCAMP';
export type Purpose = 'FAST_APPLICANTS' | 'FIT_APPLICANTS' | 'BRAND_AWARENESS';
export type InvoiceMethod = 'TAX_INVOICE' | 'NEGOTIATE';
export type CreativeMethod = 'REQUEST_PRODUCTION' | 'PROVIDE_DIRECTLY';
export type ProductCategory = 'JOB_POSTING' | 'BANNER';

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
  withChannels: boolean;
  /** 집행 첫 주 월요일 `yyyy-MM-dd`. */
  weekStart: string | null;
  weekCount: number;
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
  withChannels: false,
  weekStart: null,
  weekCount: 1,
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
/** 신청 가능한 주 수. 다음 주 월요일부터 12주(랜딩 `운영 원칙`). */
export const BOOKABLE_WEEKS = 12;

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

/** 오늘 다음에 오는 월요일. 오늘이 월요일이면 다음 주 월요일이다. */
export function nextMonday(today: Date): Date {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = (8 - base.getDay()) % 7 || 7;
  return addDays(base, diff);
}

export function weekEnd(weekStart: string, weekCount: number): string {
  return toYmd(addDays(parseYmd(weekStart), weekCount * 7 - 1));
}

export function selectedProducts(values: FormValues) {
  return PLACEMENTS.filter((p) => values.productIds.includes(p.id));
}

export function periodText(values: FormValues): string | null {
  if (!values.weekStart) return null;
  const end = weekEnd(values.weekStart, values.weekCount);
  return `${formatDate(values.weekStart, true)} – ${formatDate(end, true)} · ${values.weekCount}주`;
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
  if (step === 2 && v.productIds.length === 0) {
    e.productIds = '광고 상품을 하나 이상 선택해 주세요.';
  }
  if (step === 3) {
    if (!v.weekStart) e.weekStart = '집행할 주를 선택해 주세요.';
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
  const categories = [...new Set(products.map((p) => p.category))];
  const lines = [
    `[희망 상품] ${products.map((p) => p.title).join(', ')}`,
    ...(v.withChannels
      ? ['[추가 상담] 렛츠커리어 채널 광고(인스타그램·카카오톡·웹 배너)도 함께 상담 희망']
      : []),
    ...(v.weekStart
      ? [`[희망 기간] ${v.weekStart} ~ ${weekEnd(v.weekStart, v.weekCount)} (${v.weekCount}주)`]
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
