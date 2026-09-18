/**
 * 마지막으로 로그인에 성공한 수단. 로그인 화면이 그 버튼 위에 "최근 로그인" 말풍선을 띄운다(`로그인.png`).
 *
 * 이 브라우저의 기록이라 `localStorage` 에 둔다. 로그아웃해도 지우지 않는다 — 다음에 어떤 버튼을 눌렀었는지
 * 알려 주려는 표시다. 기업 회원의 이메일 로그인도 `email` 이다.
 */
export type SignInMethod = 'email' | 'kakao' | 'naver';

const METHOD_KEY = 'ogonggo.web.lastSignInMethod';

/** 간편 로그인은 렛츠커리어를 다녀온 뒤에야 성공을 안다. 떠날 때 고른 수단을 여기 두고 콜백이 꺼낸다. */
const PENDING_SOCIAL_KEY = 'ogonggo.web.pendingSocialMethod';

const METHODS: readonly SignInMethod[] = ['email', 'kakao', 'naver'];

const isMethod = (value: string | null): value is SignInMethod =>
  value !== null && (METHODS as readonly string[]).includes(value);

export function recordSignInMethod(method: SignInMethod): void {
  localStorage.setItem(METHOD_KEY, method);
}

export function readSignInMethod(): SignInMethod | null {
  const value = localStorage.getItem(METHOD_KEY);
  return isMethod(value) ? value : null;
}

export function savePendingSocialMethod(method: 'kakao' | 'naver'): void {
  sessionStorage.setItem(PENDING_SOCIAL_KEY, method);
}

/** 콜백이 교환에 성공했을 때 부른다. 꺼낸 값을 최근 로그인으로 남긴다. */
export function recordPendingSocialMethod(): void {
  const value = sessionStorage.getItem(PENDING_SOCIAL_KEY);
  sessionStorage.removeItem(PENDING_SOCIAL_KEY);
  if (value === 'kakao' || value === 'naver') {
    recordSignInMethod(value);
  }
}
