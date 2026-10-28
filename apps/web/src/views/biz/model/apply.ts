import type {
  CreateAdvertisementInquiryRequest,
  CreateAdvertisementInquiryRequestCompanyNameSource,
  CreateAdvertisementInquiryRequestPromotionChannel,
  MyAccountResponse,
} from '@ogonggo/api';
import { formatPhone } from '@/shared/lib/formatPhone';

/**
 * `/biz` 신청서의 모양과 검증. `apps/launch-notice/src/lib/apply.ts` 에서 옮겨 와 `출시 알림만` 모드를 뺐다
 * (PRD 5절). 진짜 관문은 서버다 — 여기 검증은 사용자가 바로 알아차리라고 있다.
 */

export type PromotionChannel = CreateAdvertisementInquiryRequestPromotionChannel;
export type CompanyNameSource = CreateAdvertisementInquiryRequestCompanyNameSource;

/** 채널 선택의 첫 단계. 오픈채팅방을 고르면 방 여섯 곳 중 하나를 더 고른다. */
export type ChannelGroup = 'INSTAGRAM' | 'OPEN_CHAT' | 'RECOMMENDATION';

export interface ApplyValues {
  company: string;
  companyNameSource: CompanyNameSource;
  name: string;
  title: string;
  phone: string;
  email: string;
  channelGroup: ChannelGroup | null;
  /** `channelGroup` 이 `OPEN_CHAT` 일 때 고른 방. */
  openChatRoom: PromotionChannel | null;
  role: string;
  link: string;
  survey: string;
  /** 요청사항·기타. 선택이다. 서버에 칸이 없어 설문 답변 뒤에 붙여 보낸다(`toRequest`). */
  request: string;
  /** 개인정보 수집·이용 동의. 필수다. */
  agree: boolean;
  /** 마케팅 정보 수신. 선택이다. */
  marketing: boolean;
  /**
   * 사람은 채우지 않는 자리(허니팟). 화면 밖에 숨겨 두고, 값이 있으면 자동 제출로 보고 보내지 않는다.
   * CAPTCHA 없이 흔한 스팸 봇을 거르는 가장 싼 방법이다.
   */
  website: string;
}

export const EMPTY_VALUES: ApplyValues = {
  company: '',
  companyNameSource: 'MANUAL',
  name: '',
  title: '',
  phone: '',
  email: '',
  channelGroup: null,
  openChatRoom: null,
  role: '',
  link: '',
  survey: '',
  request: '',
  agree: false,
  marketing: false,
  website: '',
};

/** 검증 결과. 키는 폼 칸 이름, 값은 그 자리에 띄울 문구다. */
export type ApplyErrors = Partial<Record<keyof ApplyValues | 'channel', string>>;

const isBlank = (value: string) => value.trim().length === 0;

/** 고른 채널을 서버 enum 값으로. 아직 다 고르지 않았으면 `null`. */
export function promotionChannelOf(values: ApplyValues): PromotionChannel | null {
  switch (values.channelGroup) {
    case 'INSTAGRAM':
      return 'INSTAGRAM';
    case 'RECOMMENDATION':
      return 'RECOMMENDATION_REQUESTED';
    case 'OPEN_CHAT':
      return values.openChatRoom;
    default:
      return null;
  }
}

/**
 * 비어 있으면 안 되는 자리, 이메일과 공고 링크의 모양을 본다.
 *
 * 링크는 `new URL()` 로 재지 않는다. `letscareer.co.kr/jobs/1` 처럼 스킴 없이 적는 경우가 흔한데 그건 오타가
 * 아니라 그냥 주소이고, 되돌려 보내면 신청을 포기한다. 점이 있는지만 본다 — 담당자가 열어 볼 주소다.
 *
 * 개인 메일(네이버·지메일 등)도 받는다(2026-09-05 결정). 모양만 본다.
 */
export function validateApply(values: ApplyValues): ApplyErrors {
  const errors: ApplyErrors = {};

  if (isBlank(values.company)) errors.company = '회사명을 입력해주세요.';
  if (isBlank(values.name)) errors.name = '담당자 이름을 입력해주세요.';
  if (isBlank(values.title)) errors.title = '직함을 입력해주세요.';
  if (isBlank(values.phone)) errors.phone = '연락처를 입력해주세요.';

  const email = values.email.trim();
  const [local = '', domain = ''] = email.split('@');
  if (isBlank(email)) {
    errors.email = '이메일을 입력해주세요.';
  } else if (!local || !domain.includes('.') || email.split('@').length !== 2) {
    errors.email = '이메일 주소를 다시 확인해주세요.';
  }

  if (values.channelGroup === null) {
    errors.channel = '홍보 채널을 한 곳 선택해주세요.';
  } else if (values.channelGroup === 'OPEN_CHAT' && values.openChatRoom === null) {
    errors.channel = '오픈채팅방을 한 곳 선택해주세요.';
  }
  if (isBlank(values.role)) errors.role = '채용 직무명을 입력해주세요.';
  if (isBlank(values.link)) {
    errors.link = '채용공고 링크를 입력해주세요.';
  } else if (!values.link.includes('.')) {
    errors.link = '채용공고 링크를 다시 확인해주세요.';
  }
  if (isBlank(values.survey)) errors.survey = '답변을 입력해주세요.';
  if (!values.agree) errors.agree = '개인정보 수집·이용에 동의해주세요.';

  return errors;
}

export function hasErrors(errors: ApplyErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** 첫 오류 칸의 순서. 제출이 막히면 이 순서로 첫 칸에 초점을 옮긴다. */
export const FIELD_ORDER: (keyof ApplyErrors)[] = [
  'company',
  'name',
  'title',
  'phone',
  'email',
  'channel',
  'role',
  'link',
  'survey',
  'agree',
];

/**
 * 요청사항을 설문 답변 뒤에 붙일 때 쓰는 머리말. 서버의 `promotionAnswer` 는 2000자라
 * 설문 1490자 + 머리말 9자 + 요청사항 500자로 나눠 화면 `maxLength` 를 건다.
 */
const REQUEST_HEADER = '\n\n[요청사항]\n';
export const SURVEY_MAX_LENGTH = 1490;
export const REQUEST_MAX_LENGTH = 500;

/** 설문 답변과 요청사항을 `promotionAnswer` 하나로 합친다. 요청사항이 비면 설문 답변만 보낸다. */
export function promotionAnswerOf(values: ApplyValues): string {
  const survey = values.survey.trim();
  const request = values.request.trim();
  return request ? `${survey}${REQUEST_HEADER}${request}` : survey;
}

/** 페이지에 처음 들어온 순간의 유입 원본. 서버가 이것으로 유입 경로를 판정한다. */
export type InflowFields = Pick<
  CreateAdvertisementInquiryRequest,
  | 'utmSource'
  | 'utmMedium'
  | 'utmCampaign'
  | 'utmContent'
  | 'referrer'
  | 'entryHost'
  | 'landingPath'
>;

export function toRequest(
  values: ApplyValues,
  inflow: InflowFields,
): CreateAdvertisementInquiryRequest {
  return {
    inquiryType: 'FREE_PROMOTION',
    companyName: values.company.trim(),
    companyNameSource: values.companyNameSource,
    managerName: values.name.trim(),
    managerTitle: values.title.trim(),
    phoneNumber: values.phone.trim(),
    email: values.email.trim(),
    // 검증을 지난 뒤에만 부른다. 고르지 않았으면 위에서 막힌다.
    promotionChannel: promotionChannelOf(values) ?? 'RECOMMENDATION_REQUESTED',
    hiringJobName: values.role.trim(),
    jobPostingUrl: values.link.trim(),
    promotionAnswer: promotionAnswerOf(values),
    marketingConsent: values.marketing,
    ...inflow,
  };
}

/** 미리 채울 수 있는 칸(PRD 5절 표). 직함은 회원 정보에 없어 늘 비운다. */
export type PrefillValues = Partial<
  Pick<ApplyValues, 'company' | 'companyNameSource' | 'name' | 'phone' | 'email'>
>;

/**
 * 로그인한 계정으로 담당자 정보를 채운다(PRD 5절 표, 결정 6 — 일반 회원도 채운다).
 *
 * 기업 회원은 기업 정보, 그 밖(일반 회원·멘토·관리자)은 개인 프로필이다. 서버도 기업 회원이 아니면 일반
 * 회원으로 저장한다. 알림 이메일이 없으면 가입 이메일이다. 기업 회원의 회사명은 입력 방식 `MEMBER_PROFILE` 이다.
 */
export function prefillFrom(account: MyAccountResponse): PrefillValues {
  const nonBlank = (value: string | undefined) => (value?.trim() ? value.trim() : undefined);
  if (account.role === 'COMPANY') {
    const company = account.companyProfile;
    const organization = nonBlank(company?.organizationName);
    return {
      company: organization,
      companyNameSource: organization ? 'MEMBER_PROFILE' : undefined,
      name: nonBlank(company?.managerName),
      phone: company?.managerPhone ? formatPhone(company.managerPhone) : undefined,
      email: nonBlank(company?.notificationEmail) ?? nonBlank(account.email),
    };
  }
  const profile = account.profile;
  return {
    name: nonBlank(profile?.name),
    phone: profile?.phoneNum ? formatPhone(profile.phoneNum) : undefined,
    email: nonBlank(profile?.notificationEmail) ?? nonBlank(account.email),
  };
}

/** 채울 값이 하나라도 있는지. 폼 위 안내 한 줄을 그때만 보인다. */
export function hasPrefill(prefill: PrefillValues): boolean {
  return Boolean(prefill.company || prefill.name || prefill.phone || prefill.email);
}

/** 비어 있는 칸만 채운다. 계정 응답이 오기 전에 사람이 먼저 쳤으면 그 값을 덮지 않는다. */
export function applyPrefill(values: ApplyValues, prefill: PrefillValues): ApplyValues {
  const next = { ...values };
  for (const key of ['company', 'name', 'phone', 'email'] as const) {
    const value = prefill[key];
    if (value && next[key].trim() === '') {
      next[key] = value;
      if (key === 'company' && prefill.companyNameSource) {
        next.companyNameSource = prefill.companyNameSource;
      }
    }
  }
  return next;
}
