/**
 * 오공고가 발급한 토큰을 보관한다. 일반 회원(렛츠커리어 교환) 과 기업 회원이 같은 토큰을 받는다.
 *
 * 액세스 토큰(30분) 은 `sessionStorage`, 리프레시 토큰(14일) 은 `localStorage` 에 둔다. 액세스 토큰은 탭을
 * 닫으면 사라져도 리프레시 토큰으로 다시 받으면 되고, 리프레시 토큰은 탭을 닫아도 남아야 다시 로그인하지
 * 않는다. 백엔드가 토큰을 응답 본문으로 주므로 httpOnly 쿠키는 백엔드를 바꾸지 않고는 쓸 수 없다.
 *
 * 렛츠커리어 토큰은 여기에 두지 않는다. 교환에만 쓰고 버린다.
 *
 * 서버에서 불리면 아무것도 읽지 않는다. `providers.tsx` 가 이 모듈의 `getAccessToken` 을
 * `setAccessTokenProvider` 로 등록하는데, 클라이언트 컴포넌트도 서버에서 한 번 렌더되고 서버 컴포넌트의
 * 요청도 같은 `httpClient` 를 지난다. 서버에서 `null` 을 돌려주므로 서버 쪽 요청은 지금처럼 토큰 없이 간다.
 */
const ACCESS_TOKEN_KEY = 'ogonggo.web.accessToken';
const REFRESH_TOKEN_KEY = 'ogonggo.web.refreshToken';

/** 같은 탭 안에서의 변경을 알린다. `storage` 이벤트는 다른 탭의 변경에만 온다. */
const CHANGE_EVENT = 'ogonggo:auth-tokens';

const isBrowser = () => typeof window !== 'undefined';

function notifyChange(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getAccessToken(): string | null {
  return isBrowser() ? sessionStorage.getItem(ACCESS_TOKEN_KEY) : null;
}

export function getRefreshToken(): string | null {
  return isBrowser() ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
}

/** 로그인·가입 응답의 두 토큰을 함께 둔다. */
export function saveTokens(tokens: { accessToken: string; refreshToken: string }): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  notifyChange();
}

/** 재발급은 액세스 토큰만 바꾼다. 리프레시 토큰은 백엔드가 새로 주지 않는다. */
export function saveAccessToken(accessToken: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifyChange();
}

/**
 * 로그인 상태로 볼지. 리프레시 토큰이 있으면 로그인이다 — 액세스 토큰은 탭을 닫으면 없어져도 첫 401 에서
 * 다시 받는다.
 */
export function isSignedIn(): boolean {
  return getRefreshToken() !== null;
}

/** `useSyncExternalStore` 용 구독. 이 탭의 저장·삭제와 다른 탭의 `localStorage` 변경을 함께 받는다. */
export function subscribeTokens(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
