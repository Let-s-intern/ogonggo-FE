import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { isDark } from '@/lib/card/color';
import { loadBrandSvg, loadEmoji, loadFonts } from '@/lib/card/assets';
import { measureSlide } from '@/lib/card/layout';
import { CtaSlide, InfoSlide, type SlideAssets } from '@/lib/card/template';
import { CARD_SIZES, SLIDE_COUNT, type RenderRequest } from '@/lib/card/types';

export const runtime = 'nodejs';

/**
 * 카드 한 장을 PNG 로 그린다. 미리보기와 다운로드가 같은 경로를 쓴다 — 미리보기에서 본 그대로
 * 받는다.
 *
 * 본문이 가장 작은 글자로도 넘치면 `X-Card-Overflow: 1` 을 붙인다. 이미지는 그대로 돌려주고
 * 편집 화면이 경고한다.
 */
export async function POST(request: Request) {
  let body: RenderRequest;
  try {
    body = (await request.json()) as RenderRequest;
  } catch {
    return Response.json({ message: '요청 본문을 읽을 수 없습니다.' }, { status: 400 });
  }
  const size = CARD_SIZES[body.size];
  if (
    !size ||
    !body.spec ||
    !Number.isInteger(body.slide) ||
    body.slide < 0 ||
    body.slide >= SLIDE_COUNT
  ) {
    return Response.json({ message: '크기나 장 번호가 잘못됐습니다.' }, { status: 400 });
  }

  const { spec } = body;
  const [fonts, letscareerMark, ogonggoLogo] = await Promise.all([
    loadFonts(),
    // 밝은 바탕에는 렛츠커리어 파랑, 어두운 바탕에는 흰색으로 칠한다.
    loadBrandSvg('letscareer', isDark(spec.theme.textColor) ? '#4F6BFF' : '#FFFFFF'),
    loadBrandSvg('ogonggo'),
  ]);
  const assets: SlideAssets = { letscareerMark, ogonggoLogo };

  let overflow = false;
  let element;
  if (body.slide === 2) {
    element = <CtaSlide spec={spec} size={size} assets={assets} />;
  } else {
    const isSummary = body.slide === 0;
    const sections = isSummary ? spec.content.summarySections : spec.content.detailSections;
    const note = isSummary ? spec.content.note : '';
    const metrics = measureSlide(size, spec.content.headline, sections, note);
    overflow = metrics.overflow;
    element = (
      <InfoSlide
        spec={spec}
        size={size}
        metrics={metrics}
        sections={sections}
        note={note}
        assets={assets}
      />
    );
  }

  // next/og 의 ImageResponse 는 이모지를 외부 CDN 에서만 받는다. 받아 둔 Twemoji 를 쓰려고 같은
  // 엔진(satori)을 직접 부르고 resvg 로 PNG 를 만든다.
  const svg = await satori(element, {
    width: size.width,
    height: size.height,
    fonts,
    loadAdditionalAsset: async (code, segment) => {
      if (code === 'emoji') {
        return (await loadEmoji(segment)) ?? '';
      }
      return [];
    },
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size.width } }).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
      'X-Card-Overflow': overflow ? '1' : '0',
    },
  });
}
