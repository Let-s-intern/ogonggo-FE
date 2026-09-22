/**
 * 렛츠커리어 SSO 요청을 `Origin` 없이 대신 보내는 서버리스 함수. 어드민 배포본의 `/letscareer-api/**` 가
 * `vercel.json` 의 rewrite 로 여기에 들어온다.
 *
 * 브라우저는 같은 오리진 POST 에도 `Origin: https://admin.ogonggo.co.kr` 을 붙이고, 버셀 rewrite 는 요청
 * 헤더를 고칠 수 없어 그대로 넘어간다. 렛츠커리어 CORS 허용 목록에 오공고 도메인이 하나도 없어, 스프링이
 * 본문을 보기도 전에 403 평문 `Invalid CORS request` 로 끊는다. 그래서 rewrite 대신 함수를 한 겹 둔다.
 *
 * 2026-09-22 확인: 같은 요청에서 `Origin` 만 빼면 400 `SSO_INVALID_CREDENTIALS` 까지 간다. `Referer`,
 * `User-Agent`, `Sec-Fetch-*` 는 붙여도 400 이라 렛츠커리어가 보는 것은 `Origin` 하나다.
 *
 * 렛츠커리어를 부르는 것은 이 함수이고 브라우저는 같은 오리진만 부르므로 CORS 가 지킬 경계가 없다.
 * 렛츠커리어가 실제로 거는 제한은 `redirectUri` 화이트리스트이고 그것은 그대로 걸린다.
 * `apps/web` 은 같은 일을 `src/proxy.ts` 가 하고, 로컬 어드민은 `vite.config.ts` 의 프록시가 한다.
 */

/** 렛츠커리어 API 오리진. 버셀 rewrite 는 환경변수를 읽지 못해 주소를 파일에 적는다(`vercel.json` 과 같다). */
const LETSCAREER_API_ORIGIN = 'https://3ccm7bgq1b.execute-api.ap-northeast-2.amazonaws.com';

/**
 * 지나갈 수 있는 경로. `vercel.json` 의 rewrite 가 넘겨준 `path` 쿼리와 맞춘다.
 *
 * 이 목록이 없으면 누구나 이 주소로 렛츠커리어의 아무 API 나 부를 수 있는 열린 프록시가 된다. 어드민이
 * 부르는 것은 통합로그인 하나뿐이라(`src/shared/api/letscareer.ts`) 목록도 하나다.
 */
const ALLOWED_PATHS = new Set(['v1/sso/authenticate']);

/** 렛츠커리어 오류 응답과 같은 봉투. 로그인 화면이 `code` 로 문구를 가른다. */
function errorResponse(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ status, code, message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/**
 * `Origin` 을 떼고 렛츠커리어로 보낸 뒤 상태 코드와 본문을 그대로 돌려준다.
 *
 * 요청 헤더를 이어받지 않고 `content-type` 만 새로 붙인다. 오공고 액세스 토큰이 `Authorization` 이나
 * 쿠키로 다른 서비스에 나가는 일을 없애려면 "무엇을 뺄지" 가 아니라 "무엇만 보낼지" 로 적어야 한다
 * (`src/shared/api/letscareer.ts` 가 `@ogonggo/api` 의 `httpClient` 를 쓰지 않는 것과 같은 이유다).
 */
export async function POST(request: Request): Promise<Response> {
  const path = new URL(request.url).searchParams.get('path') ?? '';
  if (!ALLOWED_PATHS.has(path)) {
    return errorResponse(
      404,
      'PROXY_PATH_NOT_ALLOWED',
      `이 프록시로는 지날 수 없는 경로입니다: ${path}`,
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${LETSCAREER_API_ORIGIN}/api/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: await request.text(),
    });
  } catch {
    // 렛츠커리어에 닿지 못했다. 502 로 가르지 않으면 로그인 화면이 계정 문제로 보이게 된다.
    return errorResponse(
      502,
      'PROXY_UPSTREAM_UNREACHABLE',
      '렛츠커리어 서버에 연결하지 못했습니다.',
    );
  }

  // 본문과 상태 코드를 그대로 넘긴다. 403 평문까지 그대로 와야 로그인 화면이 원인을 가를 수 있다.
  // `set-cookie` 등 나머지 응답 헤더는 옮기지 않는다 — 렛츠커리어 쿠키를 오공고 도메인에 심을 이유가 없다.
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8',
    },
  });
}
