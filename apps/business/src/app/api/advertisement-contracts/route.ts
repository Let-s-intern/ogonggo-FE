/**
 * 광고 신청을 user API(`POST /api/v1/advertisement-contracts`)로 넘긴다.
 *
 * 브라우저가 API 를 바로 부르면 `biz.ogonggo.co.kr`·프리뷰 주소가 user API 의 CORS 허용 목록에 없어 403 이다.
 * 서버에서 새로 요청하면 `Origin` 헤더가 붙지 않아 CORS 검사를 타지 않는다. `next.config` rewrites 는 브라우저의
 * `Origin` 을 그대로 넘길 수 있어 쓰지 않는다.
 *
 * 비회원 신청이라 토큰은 넘기지 않는다. 본문은 검사 없이 그대로 넘기고 검증은 서버에 맡긴다.
 */
const USER_API_ORIGIN = process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080';

export async function POST(request: Request) {
  const body = await request.text();
  try {
    const upstream = await fetch(`${USER_API_ORIGIN}/api/v1/advertisement-contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
      cache: 'no-store',
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch {
    return Response.json(
      { status: 502, code: 'UPSTREAM_UNREACHABLE', message: '신청 서버에 연결하지 못했습니다.' },
      { status: 502 },
    );
  }
}
