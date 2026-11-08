/**
 * 로그인 뒤 돌아갈 화면(`/login?redirect=`). 기준은 `apps/web/src/shared/lib/returnPath.ts` 다.
 *
 * 받는 값은 이 사이트 안의 경로뿐이다. 주소창에서 누구나 `?redirect=` 를 바꿀 수 있으므로, 다른 사이트로 보내는
 * 값을 그대로 따르면 로그인 화면이 피싱 사이트로 가는 징검다리가 된다(열린 리다이렉트).
 *
 * `/` 로 시작하고 `//`·`/\` 로 시작하지 않아야 한다 — 둘 다 브라우저가 다른 사이트 주소로 읽는다. 로그인·가입
 * 화면 자신도 받지 않는다. 돌아갈 곳으로 받으면 로그인 뒤 다시 그 화면이 뜬다.
 */
export function sanitizeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return null;
  }
  const [pathname = ''] = value.split(/[?#]/);
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }
  return value;
}

/** 로그인 화면 주소. 로그인 뒤 `path` 로 돌아온다. 로그인이 필요한 메뉴와 화면이 쓴다. */
export function loginHref(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`;
}
