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
 * 신청서를 검증한다. 비어 있으면 안 되는 자리, 이메일과 공고 링크의 모양을 본다.
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

  // 개인 메일(네이버·지메일 등)도 받는다(2026-09-05 결정). 한국 기업 담당자가 실제로 그런
  // 주소를 쓰는 경우가 흔한데, 막아 두면 진짜 신청자가 여기서 되돌아간다. 모양만 본다.
  const email = payload.email.trim().toLowerCase();
  const domain = email.split('@')[1] ?? '';
  if (isBlank(email) || !domain.includes('.')) {
    errors.email = '이메일을 입력해주세요.';
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

/**
 * 연락처에 하이픈을 넣는다. 입력하는 동안 부르므로 아직 덜 친 번호도 그대로 돌려줘야 한다.
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

  // 휴대폰(`010`)은 길이를 보지 않고 3-4-4 로 간다. 길이로만 나누면 여덟 자리째에
  // `010-123-45` 로 갈랐다가 열한 자리째에 `010-1234-5678` 로 다시 갈라, 치는 도중에
  // 하이픈이 한 칸 뛴다. 010 은 11자리로 정해져 있으므로 처음부터 그 모양으로 둔다.
  if (digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
