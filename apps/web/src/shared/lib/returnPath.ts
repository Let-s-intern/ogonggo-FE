/**
 * 로그인 뒤 돌아갈 화면. `/login?redirect=` 로 받거나, 간편 로그인처럼 다른 사이트를 다녀오는 흐름에서는
 * 떠나기 전에 `sessionStorage` 에 적어 두었다가 콜백에서 꺼낸다(렛츠커리어 `redirect_uri` 에는 쿼리를 붙일 수
 * 없다. `shared/api/letscareer.ts` 의 `letsCareerCallbackUri`).
 *
 * 받는 값은 이 사이트 안의 경로뿐이다. 주소창에서 누구나 `?redirect=` 를 바꿀 수 있으므로, 다른 사이트로
 * 보내는 값을 그대로 따르면 로그인 화면이 피싱 사이트로 가는 징검다리가 된다(열린 리다이렉트).
 */

/**
 * 같은 사이트의 경로면 그대로, 아니면 `null`.
 *
 * `/` 로 시작하고 `//` 로 시작하지 않아야 한다 — `//evil.example` 은 스킴만 뺀 다른 사이트 주소다.
 * 브라우저는 `/\evil.example` 의 역슬래시도 슬래시로 읽으므로 같이 막는다.
 *
 * 로그인 흐름 자신의 화면(`/login`, `/auth/**`) 도 받지 않는다. 돌아갈 곳으로 받으면 로그인 뒤 다시 로그인
 * 화면이 뜬다.
 */
export function sanitizeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return null;
  }
  const [pathname = ''] = value.split(/[?#]/);
  if (pathname === '/login' || pathname.startsWith('/auth/')) {
    return null;
  }
  return value;
}

const STORAGE_KEY = 'ogonggo.web.signInReturnPath';

/**
 * 로그인 화면을 떠나기 전에 돌아갈 화면을 적는다. 간편 로그인(렛츠커리어를 다녀온다) 과 첫 로그인 뒤의 커리어
 * 정보 화면이 꺼내 쓴다. 값이 없으면 전에 적힌 것을 지운다 — 옛 시도의 값으로 돌아가지 않게.
 */
export function saveReturnPath(path: string | null): void {
  const safe = sanitizeReturnPath(path);
  if (safe) {
    sessionStorage.setItem(STORAGE_KEY, safe);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/** 적어 둔 값을 꺼내고 지운다. 저장소 값도 누가 바꿀 수 있으므로 다시 거른다. */
export function takeReturnPath(): string | null {
  const value = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  return sanitizeReturnPath(value);
}
