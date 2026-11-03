import type {
  AdCreativeSource,
  AdJobField,
  AdPlacementKey,
  AdPurpose,
  AdTargetType,
  AdTaxInvoiceType,
  AdWaitlistOption,
} from '@ogonggo/api/src/mocks/fixtures/advertisement-types';

/**
 * 광고 신청서(시안 B-04) 다섯 단계의 값. 한 객체로 들고 다니며 그대로 임시저장한다(`../lib/draft.ts`).
 * 비밀번호·인증번호는 임시저장하지 않는다.
 */

export type StepNumber = 1 | 2 | 3 | 4 | 5;

export const STEPS: readonly { n: StepNumber; title: string; description: string }[] = [
  { n: 1, title: '공고 선택', description: '광고할 공고와 목적을 골라 주세요' },
  { n: 2, title: '지면 · 일정', description: '지면과 집행 주를 추가해 주세요' },
  { n: 3, title: '담당자 · 계약', description: '견적서·계약서·세금계산서를 받을 정보예요' },
  { n: 4, title: '소재 · 역량 태그', description: '소재 준비 방식과 역량 키워드를 적어 주세요' },
  { n: 5, title: '확인', description: '신청 내용을 확인하고 동의해 주세요' },
];

/** 1단계에서 고른 게시 중 공고. */
export interface ExistingPost {
  target: AdTargetType;
  id: number;
  title: string;
}

/** 1단계 `새 공고 바로 등록`. 채용공고만 만든다. */
export interface NewJobDraft {
  title: string;
  employmentType: string;
  jobField: string;
  experienceType: string;
  /** `yyyy-MM-dd`. 상시 모집이면 비운다. */
  deadline: string;
  alwaysOpen: boolean;
  /** 근무지·급여 한 줄. 공고의 `compensation` 으로 보낸다. */
  locationAndPay: string;
  sourceUrl: string;
}

export const EMPTY_NEW_JOB: NewJobDraft = {
  title: '',
  employmentType: '',
  jobField: '',
  experienceType: '',
  deadline: '',
  alwaysOpen: false,
  locationAndPay: '',
  sourceUrl: '',
};

/** 2단계 항목 하나. 구좌 × 시작 주 × 연속 주 수. */
export interface FormItem {
  /** 화면 안에서만 쓰는 고유값. */
  uid: string;
  placementKey: AdPlacementKey;
  jobField?: AdJobField;
  /** 시작 주의 월요일(공고 기간 단위면 그 달 1일). */
  startDate: string;
  /** 1~4. 공고 기간 단위면 1. */
  weeks: number;
}

export interface SignUpDraft {
  email: string;
  codeSent: boolean;
  /** 인증을 마친 이메일. 이메일을 고치면 비운다. */
  verifiedEmail: string;
  /** 개인 메일일 때 올린 사업자등록증 이미지 주소. */
  businessLicenseUrl: string;
}

export interface AdApplicationFormValues {
  postMode: 'EXISTING' | 'NEW';
  post?: ExistingPost;
  newJob: NewJobDraft;
  purpose: AdPurpose;
  items: FormItem[];
  useCoupon: boolean;
  waitlist: AdWaitlistOption;
  signUp: SignUpDraft;
  contact: {
    name: string;
    title: string;
    email: string;
    phone: string;
    ccEmail: string;
    companyName: string;
  };
  billing: {
    contractEmail: string;
    taxInvoiceEmail: string;
    taxInvoiceType: AdTaxInvoiceType;
  };
  memo: string;
  creative: {
    source: AdCreativeSource;
    headline: string;
    skillTags: string[];
    taskTags: string[];
    bannerImageUrlPc: string;
    bannerImageUrlMo: string;
  };
  privacyAgreed: boolean;
  policyAgreed: boolean;
}

export const EMPTY_FORM: AdApplicationFormValues = {
  postMode: 'EXISTING',
  newJob: EMPTY_NEW_JOB,
  purpose: 'FIT_APPLICANTS',
  items: [],
  useCoupon: false,
  waitlist: 'NONE',
  signUp: { email: '', codeSent: false, verifiedEmail: '', businessLicenseUrl: '' },
  contact: { name: '', title: '', email: '', phone: '', ccEmail: '', companyName: '' },
  billing: { contractEmail: '', taxInvoiceEmail: '', taxInvoiceType: 'CLAIM' },
  memo: '',
  creative: {
    source: 'OGONGGO_MADE',
    headline: '',
    skillTags: [],
    taskTags: [],
    bannerImageUrlPc: '',
    bannerImageUrlMo: '',
  },
  privacyAgreed: false,
  policyAgreed: false,
};

/** 광고 목적과 추천 지면(PRD `광고 신청` 1단계의 A2+A6, A4+A1, A3 를 구좌 키로 옮겼다). */
export const PURPOSES: readonly {
  value: AdPurpose;
  label: string;
  recommended: readonly AdPlacementKey[];
}[] = [
  {
    value: 'FAST_APPLICANTS',
    label: '지원자 빨리 모으기',
    recommended: ['LIST_TOP_RECRUIT', 'CALENDAR_TOP'],
  },
  {
    value: 'FIT_APPLICANTS',
    label: '적합한 지원자 찾기',
    recommended: ['SIMILAR_TOP_RECRUIT', 'RECOMMEND_TOP_RECRUIT'],
  },
  { value: 'BRAND_AWARENESS', label: '기업 알리기', recommended: ['MAIN_TOP_BANNER_RECRUIT'] },
];

export const WAITLIST_OPTIONS: readonly { value: AdWaitlistOption; label: string }[] = [
  { value: 'NONE', label: '대기 안 함' },
  { value: 'SAME_PERIOD', label: '같은 기간 취소 시 연락' },
  { value: 'ANY_PERIOD', label: '다른 기간이어도 연락' },
];

export const newUid = () => Math.random().toString(36).slice(2, 10);
