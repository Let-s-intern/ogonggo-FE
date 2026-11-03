/**
 * 비즈니스 앱이 받은 오공고 토큰을 보관한다. 모양은 web 의 `apps/web/src/shared/api/authTokens.ts` 와 같고
 * 다른 것은 셋이다.
 *
 * - 키 이름이 `ogonggo.business.*` 다. 비즈니스는 출처(`biz.ogonggo.co.kr`)가 달라 저장소가 원래 갈리지만,
 *   로컬에서 두 앱을 같은 호스트로 띄워도 키가 겹치지 않게 한다(PRD `비즈니스 서브도메인`).
 * - 렛츠커리어 토큰이 없다. 기업회원은 오공고 계정으로만 로그인한다.
 * - 목데이터 모드에서도 토큰으로 로그인을 판정한다. web 은 목 모드면 늘 로그인으로 보지만, 비즈니스는 로그인·가입
 *   화면 자체를 목으로 확인해야 해서 그렇게 하지 않는다. 목 로그인은 `shared/mocks/businessAuth.ts` 가 받는다.
 *
 * 액세스 토큰(30분) 은 `sessionStorage`, 리프레시 토큰(14일) 은 `localStorage` 다. 이유는 web 주석과 같다.
 * 서버에서 불리면 아무것도 읽지 않는다.
 */
const ACCESS_TOKEN_KEY = 'ogonggo.business.accessToken';
const REFRESH_TOKEN_KEY = 'ogonggo.business.refreshToken';

/** 같은 탭 안에서의 변경을 알린다. `storage` 이벤트는 다른 탭의 변경에만 온다. */
const CHANGE_EVENT = 'ogonggo:business-auth-tokens';

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

export function saveTokens(tokens: { accessToken: string; refreshToken: string }): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  notifyChange();
}

/** 재발급은 액세스 토큰만 바꾼다. 리프레시 토큰은 백엔드가 새로 주지 않는다. */
export function saveAccessToken(accessToken: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

/** 만료 시각이 이 안으로 다가온 토큰은 요청이 서버에 닿기 전에 만료될 수 있어 쓸 수 없는 것으로 본다. */
const EXPIRY_MARGIN_MS = 30 * 1000;

/** 액세스 토큰이 있고 곧 만료되지 않는지. JWT 의 `exp` 를 읽지 못하면 쓸 수 있는 것으로 본다. */
export function hasUsableAccessToken(): boolean {
  const token = getAccessToken();
  if (!token) {
    return false;
  }
  const expiresAt = readExpiry(token);
  return expiresAt === null || expiresAt - EXPIRY_MARGIN_MS > Date.now();
}

function readExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const exp = (claims as { exp?: unknown } | null)?.exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifyChange();
}

/** 리프레시 토큰이 있으면 로그인이다. 액세스 토큰은 탭을 닫으면 없어져도 첫 401 에서 다시 받는다. */
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
