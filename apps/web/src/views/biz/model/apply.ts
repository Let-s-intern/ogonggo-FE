import type {
  CreateAdvertisementInquiryRequest,
  CreateAdvertisementInquiryRequestCompanyNameSource,
  CreateAdvertisementInquiryRequestPromotionChannel,
} from '@ogonggo/api';

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
    promotionAnswer: values.survey.trim(),
    marketingConsent: values.marketing,
    ...inflow,
  };
}

/**
 * 연락처에 하이픈을 넣는다. 입력하는 동안 부르므로 아직 덜 친 번호도 그대로 돌려줘야 한다.
 * `apps/launch-notice/src/lib/apply.ts` 의 것을 그대로 옮겼다.
 *
 * 국번 자릿수가 갈린다.
 *   02        서울 지역번호만 두 자리다 (02-1234-5678, 02-123-4567)
 *   그 외 10자리  3-3-4 (031-123-4567, 011-123-4567)
 *   그 외 11자리  3-4-4 (010-1234-5678, 070-1234-5678)
 *
 * 숫자가 아닌 글자는 버린다. 붙여넣기로 `+82 10 1234 5678` 이 들어오는 경우가 있는데, 앞의
 * `82` 를 국번으로 읽으면 엉뚱하게 잘리므로 국가번호는 `0` 으로 되돌린다.
 */
export function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('82')) {
    digits = `0${digits.slice(2)}`;
  }
  digits = digits.slice(0, 11);

  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  // 휴대폰(`010`)은 길이를 보지 않고 3-4-4 로 간다. 길이로만 나누면 여덟 자리째에 `010-123-45` 로
  // 갈랐다가 열한 자리째에 `010-1234-5678` 로 다시 갈라, 치는 도중에 하이픈이 한 칸 뛴다.
  if (digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
