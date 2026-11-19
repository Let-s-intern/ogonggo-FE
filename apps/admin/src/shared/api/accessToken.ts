/**
 * 어드민 API 에 붙일 액세스 토큰과 오공고 리프레시 토큰을 보관한다.
 *
 * `localStorage` 에 둔다. 전에는 `localStorage` 라 탭마다 따로여서 새 탭·창을 열거나 탭을 닫았다 열면 다시
 * 로그인해야 했고, 액세스 토큰(30분)이 끝나면 바로 로그인 화면으로 돌아갔다("로그인이 자꾸 풀린다"). 이제는
 * 탭끼리 같은 로그인을 쓰고, 액세스 토큰이 끝나면 리프레시 토큰으로 다시 받는다(`./reissue.ts`). 로그아웃하면
 * 둘 다 지운다. 운영자만 쓰는 화면이라 브라우저에 남는 위험보다 다시 로그인하는 불편이 커서 이렇게 둔다.
 * 사용자 API 가 토큰을 응답 본문으로 주므로 httpOnly 쿠키는 백엔드를 바꾸지 않고는 쓸 수 없다.
 *
 * 리프레시 토큰은 `오공고 웹으로` 를 누를 때 웹에 로그인을 넘기는 데에도 쓴다(`./webHandoff.ts`).
 *
 * `httpClient` 가 이 값을 읽는 연결은 `main.tsx` 의 `setAccessTokenProvider` 한 줄이다.
 */
const STORAGE_KEY = 'ogonggo.admin.accessToken';
const REFRESH_STORAGE_KEY = 'ogonggo.admin.refreshToken';

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function saveAccessToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REFRESH_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_STORAGE_KEY);
}

/** 로그인 방법에 따라 없을 수 있다. 없으면 지워 두어 앞 계정의 값이 남지 않게 한다. */
export function saveRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_STORAGE_KEY, token);
    return;
  }
  localStorage.removeItem(REFRESH_STORAGE_KEY);
}
