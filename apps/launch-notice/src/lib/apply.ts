/**
 * 신청서의 모양과 검증 규칙. **브라우저와 서버가 같은 파일을 쓴다** — 브라우저 쪽은 사용자가
 * 바로 알아차리라고 있는 것이고, 진짜 관문은 서버다(`app/api/apply/route.ts`). 폼을 우회해
 * 직접 POST 하는 요청이 있으므로 검증을 클라이언트에만 두면 아무것도 막지 못한다.
 */

/** 신청 유형. 목업의 두 버튼(`지금 바로 무료 홍보` / `지금은 출시 알림만`)이다. */
export type ApplyMode = 'promo' | 'alert';

export const MODE_LABEL: Record<ApplyMode, string> = {
  promo: '무료 홍보 신청',
  alert: '출시 알림 신청',
};

/** 무료 홍보를 태울 수 있는 채널. 목업의 `select` 항목 그대로다. */
export const CHANNELS = [
  '인스타그램 @letscareer.job · 2.7만 팔로워',
  '오픈채팅방 · 마케팅 (2,015명)',
  '오픈채팅방 · 기획·운영 (1,146명)',
  '오픈채팅방 · 인사·HR·경영관리 (1,087명)',
  '오픈채팅방 · 공채 전반 (856명)',
  '오픈채팅방 · 세일즈 (330명)',
  '오픈채팅방 · AI역량·개발 (105명)',
  '정하기 어렵습니다. 추천해주세요',
] as const;

/**
 * 개인 메일 도메인. 회사 이메일을 받으려는 것이므로 이 목록에 걸리면 되돌린다.
 *
 * 완전한 목록일 수 없고 그럴 필요도 없다 — 목적은 차단이 아니라 "회사 메일을 적어 달라"는
 * 안내다. 흔한 것만 막으면 대부분 거른다.
 */
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'naver.com',
  'daum.net',
  'hanmail.net',
  'kakao.com',
  'nate.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
];

export interface ApplyPayload {
  mode: ApplyMode;
  company: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  survey: string;
  /** 개인정보 수집·이용 동의. 필수다. */
  agree: boolean;
  /** 마케팅 정보 수신. 선택이다. */
  marketing: boolean;
  /** 아래 셋은 `mode === 'promo'` 일 때만 채워진다. */
  channel?: string;
  role?: string;
  link?: string;
  /**
   * 사람은 절대 채우지 않는 자리(허니팟). 화면 밖에 숨겨 두고, 값이 있으면 자동 제출로 본다.
   * CAPTCHA 없이 흔한 스팸 봇을 거르는 가장 싼 방법이다.
   */
  website?: string;
}

/** 검증 결과. 키는 폼 필드 이름, 값은 그 자리에 띄울 문구다. */
export type ApplyErrors = Partial<Record<keyof ApplyPayload, string>>;

function isBlank(value: string | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * 신청서를 검증한다. 비어 있으면 안 되는 자리, 회사 이메일 여부, 공고 링크 모양을 본다.
 *
 * 링크는 `new URL()` 로 재지 않는다. 사용자가 `letscareer.co.kr/jobs/1` 처럼 스킴 없이 적는
 * 경우가 흔한데 그건 오타가 아니라 그냥 주소이고, 되돌려 보내면 신청을 포기한다. 점이 있는지만
 * 보고 나머지는 사람이 판단한다 — 어차피 담당자가 열어 볼 주소다.
 */
export function validateApply(payload: ApplyPayload): ApplyErrors {
  const errors: ApplyErrors = {};

  if (isBlank(payload.company)) errors.company = '회사명을 입력해주세요.';
  if (isBlank(payload.name)) errors.name = '담당자 이름을 입력해주세요.';
  if (isBlank(payload.title)) errors.title = '직함을 입력해주세요.';
  if (isBlank(payload.phone)) errors.phone = '연락처를 입력해주세요.';
  if (isBlank(payload.survey)) errors.survey = '답변을 입력해주세요.';
  if (!payload.agree) errors.agree = '개인정보 수집·이용에 동의해주세요.';

  const email = payload.email.trim().toLowerCase();
  const domain = email.split('@')[1] ?? '';
  if (isBlank(email) || !domain.includes('.')) {
    errors.email = '이메일을 입력해주세요.';
  } else if (PERSONAL_EMAIL_DOMAINS.includes(domain)) {
    errors.email = '회사 도메인 이메일로 입력해주세요.';
  }

  if (payload.mode === 'promo') {
    if (isBlank(payload.channel)) errors.channel = '채널을 한 곳 선택해주세요.';
    if (isBlank(payload.role)) errors.role = '채용 직무명을 입력해주세요.';
    if (isBlank(payload.link) || !payload.link!.includes('.')) {
      errors.link = '공고 페이지 주소를 입력해주세요.';
    }
  }

  return errors;
}

export function hasErrors(errors: ApplyErrors): boolean {
  return Object.keys(errors).length > 0;
}
