import { loadFonts } from '@/lib/card/assets';
import { loadAssets, type RenderKitManifest } from '@/lib/server/slideAssets';

export const runtime = 'nodejs';

/**
 * 편집 캔버스가 브라우저에서 `buildSlide()` 를 부르는 데 필요한 것. 서버 렌더와 같은 그림·폰트를
 * 내려준다 — 캔버스와 받은 PNG 의 글자 폭과 줄바꿈이 같아지게.
 *
 * - `/api/render-kit`: 그림(`SlideAssets`)과 폰트 굵기 목록(JSON).
 * - `/api/render-kit?weight=700`: 그 굵기의 Pretendard woff. 한 벌이 1MB 남짓이라 JSON 에 싣지 않는다.
 */
export async function GET(request: Request) {
  const weight = new URL(request.url).searchParams.get('weight');
  const fonts = await loadFonts();
  if (weight === null) {
    const manifest: RenderKitManifest = {
      assets: await loadAssets(),
      weights: fonts.map((font) => font.weight),
    };
    return Response.json(manifest, { headers: { 'Cache-Control': 'private, max-age=3600' } });
  }
  const font = fonts.find((candidate) => String(candidate.weight) === weight);
  if (!font) {
    return Response.json({ message: '없는 굵기입니다.' }, { status: 404 });
  }
  return new Response(font.data, {
    headers: {
      'Content-Type': 'font/woff',
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
