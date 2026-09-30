import { proxiableLogoUrl } from '@/entities/job/model/logo-proxy';

/**
 * CORS 헤더를 주지 않는 호스트의 로고를 같은 출처로 돌려준다. 브라우저가 픽셀을 읽어 여백을 재는
 * 데 쓴다(`entities/job/model/logo-proxy.ts`).
 *
 * 목록에 없는 호스트, 이미지가 아닌 응답, 너무 큰 파일은 거절한다. 리다이렉트 끝 주소도 목록 안이어야
 * 한다 — 목록의 호스트가 다른 곳으로 넘기면 그 너머를 대신 읽어 주게 된다.
 *
 * 로고는 바뀌는 일이 드물어 하루 캐시한다. `/api/**` 는 백엔드로 넘어가는 rewrite 가 있어
 * (`next.config.ts`) 이 경로는 그 밖에 둔다.
 */
const MAX_BYTES = 2 * 1024 * 1024;
const ONE_DAY = 86400;

export async function GET(request: Request) {
  const target = proxiableLogoUrl(new URL(request.url).searchParams.get('url') ?? '');
  if (!target) {
    return new Response('허용하지 않는 로고 주소입니다.', { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { next: { revalidate: ONE_DAY } });
  } catch {
    return new Response('로고를 받지 못했습니다.', { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !contentType.startsWith('image/') || !proxiableLogoUrl(upstream.url)) {
    return new Response('로고를 받지 못했습니다.', { status: 502 });
  }
  const body = await upstream.arrayBuffer();
  if (body.byteLength > MAX_BYTES) {
    return new Response('로고 파일이 너무 큽니다.', { status: 502 });
  }

  return new Response(body, {
    headers: {
      'content-type': contentType,
      'cache-control': `public, max-age=${ONE_DAY}, s-maxage=${ONE_DAY * 7}`,
    },
  });
}
