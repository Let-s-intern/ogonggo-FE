/**
 * `?redirect=` 로 받은 돌아갈 화면을 거른다. 같은 사이트의 경로(`/` 로 시작, `//` 가 아님)만 남기고 로그인 화면
 * 자신은 버린다. web 의 `apps/web/src/shared/lib/returnPath.ts` 의 `sanitizeReturnPath` 와 같다.
 */
export function sanitizeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return null;
  }
  const [pathname = ''] = value.split(/[?#]/);
  if (pathname === '/login') {
    return null;
  }
  return value;
}
