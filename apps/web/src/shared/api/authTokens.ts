import { isMockEnabled } from '@/shared/config/mocks';

/**
 * 오공고가 발급한 토큰을 보관한다. 일반 회원(렛츠커리어 교환) 과 기업 회원이 같은 토큰을 받는다.
 *
 * 액세스 토큰(30분) 은 `sessionStorage`, 리프레시 토큰(14일) 은 `localStorage` 에 둔다. 액세스 토큰은 탭을
 * 닫으면 사라져도 리프레시 토큰으로 다시 받으면 되고, 리프레시 토큰은 탭을 닫아도 남아야 다시 로그인하지
 * 않는다. 백엔드가 토큰을 응답 본문으로 주므로 httpOnly 쿠키는 백엔드를 바꾸지 않고는 쓸 수 없다.
 *
 * 렛츠커리어 토큰(액세스·리프레시)도 함께 둔다. 오공고 토큰으로 바꾸는 데 쓰고, 헤더의 렛츠커리어 마크를
 * 눌러 렛츠커리어 웹으로 갈 때 로그인을 이어 주는 데 한 번 더 쓴다(`./letsCareerHandoff.ts`). 둘 다
 * `localStorage` 다 — 렛츠커리어로 가는 것은 탭을 닫았다 연 뒤에도 일어나고, 렛츠커리어가 넘겨받은 뒤에는
 * 자기 리프레시 토큰으로 스스로 갱신한다. 이메일·소셜 로그인만 이 토큰을 받는다. 기업 회원과, 이 저장이
 * 생기기 전에 로그인한 사람에게는 없다.
 *
 * 서버에서 불리면 아무것도 읽지 않는다. `providers.tsx` 가 이 모듈의 `getAccessToken` 을
 * `setAccessTokenProvider` 로 등록하는데, 클라이언트 컴포넌트도 서버에서 한 번 렌더되고 서버 컴포넌트의
 * 요청도 같은 `httpClient` 를 지난다. 서버에서 `null` 을 돌려주므로 서버 쪽 요청은 지금처럼 토큰 없이 간다.
 */
const ACCESS_TOKEN_KEY = 'ogonggo.web.accessToken';
const REFRESH_TOKEN_KEY = 'ogonggo.web.refreshToken';
const LETSCAREER_ACCESS_TOKEN_KEY = 'ogonggo.web.letsCareerAccessToken';
const LETSCAREER_REFRESH_TOKEN_KEY = 'ogonggo.web.letsCareerRefreshToken';

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

/**
 * 로그인·가입 응답의 두 토큰을 함께 둔다. 앞 계정의 렛츠커리어 토큰은 지운다 — 새 계정이 렛츠커리어로
 * 로그인했다면 교환 직후 `saveLetsCareerTokens` 가 다시 채우고, 기업 회원이면 비어 있어야 한다.
 */
export function saveTokens(tokens: { accessToken: string; refreshToken: string }): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  clearLetsCareerTokens();
  notifyChange();
}

export interface LetsCareerTokens {
  accessToken: string;
  refreshToken: string;
}

/** 로그인 때 받은 렛츠커리어 토큰. 둘 중 하나라도 없으면 `null` 이다. */
export function getLetsCareerTokens(): LetsCareerTokens | null {
  if (!isBrowser()) {
    return null;
  }
  const accessToken = localStorage.getItem(LETSCAREER_ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(LETSCAREER_REFRESH_TOKEN_KEY);
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

export function saveLetsCareerTokens(tokens: LetsCareerTokens): void {
  localStorage.setItem(LETSCAREER_ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(LETSCAREER_REFRESH_TOKEN_KEY, tokens.refreshToken);
}

function clearLetsCareerTokens(): void {
  localStorage.removeItem(LETSCAREER_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LETSCAREER_REFRESH_TOKEN_KEY);
}

/** 재발급은 액세스 토큰만 바꾼다. 리프레시 토큰은 백엔드가 새로 주지 않는다. */
export function saveAccessToken(accessToken: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

/** 만료 시각이 이 안으로 다가온 토큰은 요청이 서버에 닿기 전에 만료될 수 있어 쓸 수 없는 것으로 본다. */
const EXPIRY_MARGIN_MS = 30 * 1000;

/**
 * 액세스 토큰이 있고 곧 만료되지 않는지. 토큰은 서버가 만든 JWT 라 본문의 `exp`(초 단위 유닉스 시각) 를 읽는다.
 * `exp` 를 읽지 못하면 쓸 수 있는 것으로 본다 — 판단은 서버가 한다. 목 모드의 임의 문자열 토큰이 그렇다.
 *
 * 서명은 확인하지 않는다. 이 값은 재발급이 필요한지를 가르는 데만 쓰고, 토큰이 유효한지는 서버가 정한다.
 */
export function hasUsableAccessToken(): boolean {
  const token = getAccessToken();
  if (!token) {
    return false;
  }
  const expiresAt = readExpiry(token);
  return expiresAt === null || expiresAt - EXPIRY_MARGIN_MS > Date.now();
}

/** JWT 본문의 `exp` 를 밀리초로. JWT 가 아니거나 `exp` 가 숫자가 아니면 `null`. */
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
  clearLetsCareerTokens();
  notifyChange();
}

/**
 * 로그인 상태로 볼지. 리프레시 토큰이 있으면 로그인이다 — 액세스 토큰은 탭을 닫으면 없어져도 첫 401 에서
 * 다시 받는다.
 *
 * 목데이터 모드에서는 늘 로그인이다. 목 핸들러는 토큰을 보지 않고, 마이페이지 같은 화면을 확인하는 데
 * 로그인을 끼울 이유가 없다(어드민 `RequireAuth` 와 같은 판단). 어느 회원으로 볼지는
 * `shared/config/mocks.ts` 의 `readMockRole` 이 정한다.
 */
export function isSignedIn(): boolean {
  return isMockEnabled || getRefreshToken() !== null;
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
