import { type NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionValid } from '@/lib/server/auth';

/**
 * 로그인하지 않은 요청을 막는다. 페이지는 로그인 화면으로 보내고, API 는 401 을 돌려준다. 로그인
 * 화면·로그인 API·정적 파일은 matcher 에서 뺀다.
 */
export function proxy(request: NextRequest) {
  if (sessionValid(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const login = new URL('/login', request.url);
  if (pathname !== '/') {
    login.searchParams.set('next', `${pathname}${search}`);
  }
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/((?!login|api/login|_next/static|_next/image|favicon.ico).*)'],
};
