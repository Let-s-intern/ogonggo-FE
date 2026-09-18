/**
 * 어드민 API 에 붙일 액세스 토큰을 보관한다.
 *
 * `sessionStorage` 에 둔다. 새로고침과 Vite 의 전체 리로드에는 남고, 탭을 닫으면 사라진다.
 * 메모리에만 두면 새로고침할 때마다 다시 로그인해야 하고, `localStorage` 에 두면 탭을 닫은 뒤에도
 * 관리자 토큰이 남는다. 사용자 API 가 토큰을 응답 본문으로 주므로 httpOnly 쿠키는 백엔드를 바꾸지
 * 않고는 쓸 수 없다.
 *
 * 리프레시 토큰은 보관하지 않는다. 재발급을 만들지 않았고, 액세스 토큰(30분) 이 만료되면 401 로
 * 로그인 화면에 돌아간다.
 *
 * `httpClient` 가 이 값을 읽는 연결은 `main.tsx` 의 `setAccessTokenProvider` 한 줄이다.
 */
const STORAGE_KEY = 'ogonggo.admin.accessToken';

export function getAccessToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function saveAccessToken(token: string): void {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
