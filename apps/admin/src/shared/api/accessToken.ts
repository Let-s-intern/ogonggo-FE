/**
 * 어드민 API 에 붙일 액세스 토큰을 보관한다.
 *
 * `sessionStorage` 에 둔다. 새로고침과 Vite 의 전체 리로드에는 남고, 탭을 닫으면 사라진다.
 * 메모리에만 두면 새로고침할 때마다 다시 로그인해야 하고, `localStorage` 에 두면 탭을 닫은 뒤에도
 * 관리자 토큰이 남는다. 사용자 API 가 토큰을 응답 본문으로 주므로 httpOnly 쿠키는 백엔드를 바꾸지
 * 않고는 쓸 수 없다.
 *
 * 오공고 리프레시 토큰도 같은 `sessionStorage` 에 둔다. 어드민이 재발급에 쓰지는 않는다 — 액세스 토큰(30분) 이
 * 만료되면 전처럼 401 로 로그인 화면에 돌아간다. 이 토큰은 `오공고 웹으로` 를 누를 때 웹에 로그인을 넘기려고
 * 들고 있다(`./webHandoff.ts`). 웹은 리프레시 토큰이 있어야 로그인 상태로 본다.
 *
 * `httpClient` 가 이 값을 읽는 연결은 `main.tsx` 의 `setAccessTokenProvider` 한 줄이다.
 */
const STORAGE_KEY = 'ogonggo.admin.accessToken';
const REFRESH_STORAGE_KEY = 'ogonggo.admin.refreshToken';

export function getAccessToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function saveAccessToken(token: string): void {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(REFRESH_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_STORAGE_KEY);
}

/** 로그인 방법에 따라 없을 수 있다. 없으면 지워 두어 앞 계정의 값이 남지 않게 한다. */
export function saveRefreshToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(REFRESH_STORAGE_KEY, token);
    return;
  }
  sessionStorage.removeItem(REFRESH_STORAGE_KEY);
}
