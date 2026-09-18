import { type NextRequest, NextResponse } from 'next/server';

/**
 * `/letscareer-api/**` 요청에서 `Origin` 헤더를 뺀다. 그 뒤 `next.config.ts` 의 rewrite 가 렛츠커리어로 넘긴다.
 *
 * 브라우저는 같은 오리진 POST 에도 `Origin: http://localhost:4000`(배포에서는 `https://ogonggo.co.kr`) 을
 * 붙이고, rewrite 는 그 헤더를 그대로 넘긴다. 렛츠커리어 서버의 CORS 허용 목록(`WebSecurityConfig.java` 의
 * `getDefaultCorsConfiguration`) 에 두 주소가 없어, 스프링이 본문을 보기도 전에 403 `Invalid CORS request` 로
 * 끊는다(2026-09-18 확인: 같은 요청이 `Origin` 을 빼면 400 검증 오류까지 간다).
 *
 * 렛츠커리어를 부르는 것은 이 Next 서버다. 브라우저는 같은 오리진만 부르므로 CORS 가 지킬 경계가 없다.
 * 백엔드를 고치지 않는다는 PRD 원칙에 따라 허용 목록을 늘려 달라고 하지 않고 여기서 뺀다.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete('origin');
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: '/letscareer-api/:path*',
};
