import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { loadBrandSvg, loadEmoji, loadFonts, loadIcon } from '@/lib/card/assets';
import { loadMeasure } from '@/lib/card/measure';
import type { SlideAssets } from '@/lib/card/render/primitives';
import { buildSlide } from '@/lib/card/render/slides';
import { CARD_SIZES, SLIDE_COUNT, type RenderRequest } from '@/lib/card/types';
import { VARIANT_IDS } from '@/lib/card/variants';

export const runtime = 'nodejs';

const INK = '#111111';
const WHITE = '#FFFFFF';

/** 렛츠커리어 심볼을 밝은 바탕에 놓을 때의 파랑 그라데이션(원본은 회색이다). */
const MARK_GRADIENT: [string, string] = ['#7C8CFF', '#3D5AFE'];

async function loadAssets(): Promise<SlideAssets> {
  const [
    markColor,
    markWhite,
    ogonggoLogo,
    arrowDark,
    arrowLight,
    chevronDown,
    threads,
    squarePlus,
    menu,
    plusWhite,
    dotsWhite,
  ] = await Promise.all([
    loadBrandSvg('letscareer', { gradient: MARK_GRADIENT }),
    loadBrandSvg('letscareer', { fill: WHITE }),
    loadBrandSvg('ogonggo'),
    loadIcon('arrow-up', INK, 1.5),
    loadIcon('arrow-up', WHITE, 1.5),
    loadIcon('chevron-down', INK, 2.5),
    loadIcon('brand-threads', INK, 1.8),
    loadIcon('square-plus', INK, 1.8),
    loadIcon('menu-2', INK, 1.8),
    loadIcon('plus', WHITE, 3),
    loadIcon('dots', WHITE, 3),
  ]);
  return {
    markColor,
    markWhite,
    ogonggoLogo,
    arrowDark,
    arrowLight,
    chevronDown,
    threads,
    squarePlus,
    menu,
    plusWhite,
    dotsWhite,
  };
}

/**
 * 카드 한 장을 PNG 로 그린다. 미리보기와 다운로드가 같은 경로를 쓴다 — 미리보기에서 본 그대로
 * 받는다. 미리보기는 `format: 'svg'` 로 PNG 굽기를 건너뛴다(배치는 같다).
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
    !VARIANT_IDS.includes(body.spec.variant) ||
    !Number.isInteger(body.slide) ||
    body.slide < 0 ||
    body.slide >= SLIDE_COUNT
  ) {
    return Response.json(
      { message: '시안, 크기, 장 번호 중 잘못된 값이 있습니다.' },
      { status: 400 },
    );
  }
  const scale = Math.min(1, Math.max(0.25, body.scale ?? 1));

  const [fonts, measure, assets] = await Promise.all([loadFonts(), loadMeasure(), loadAssets()]);
  const { element, overflow } = buildSlide(body.spec, body.slide, size, measure, assets);

  // next/og 의 ImageResponse 는 이모지를 외부 CDN 에서만 받는다. 받아 둔 Noto 이모지를 쓰려고 같은
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
  // 미리보기는 SVG 를 그대로 돌려주고 브라우저가 그린다. 한 장에 satori 는 수십 ms 인데 PNG 로 굽는
  // resvg 가 수백 ms 라, 설정을 바꿀 때마다 다시 그리는 미리보기에서 그 단계를 건너뛴다. 받기는 PNG.
  if (body.format === 'svg') {
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store',
        'X-Card-Overflow': overflow ? '1' : '0',
      },
    });
  }
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: Math.round(size.width * scale) } })
    .render()
    .asPng();
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
      'X-Card-Overflow': overflow ? '1' : '0',
    },
  });
}
