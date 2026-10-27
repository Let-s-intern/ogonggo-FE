import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { loadEmoji, loadFonts } from '@/lib/card/assets';
import { buildSlide } from '@/lib/card/render/slides';
import {
  CARD_SIZES,
  type CardSpec,
  ELEMENT_IDS,
  type ElementEdit,
  type RenderRequest,
  SLIDE_COUNT,
  type SlideEdits,
} from '@/lib/card/types';
import { VARIANT_IDS } from '@/lib/card/variants';
import { loadMeasure } from '@/lib/server/measure';
import { loadAssets } from '@/lib/server/slideAssets';

export const runtime = 'nodejs';

/** 렌더에 넣을 수 있는 이미지 값. 편집 화면이 만드는 base64 data URL 이미지만 받는다. */
const IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

function safeImage(value: unknown): string | undefined {
  return typeof value === 'string' && IMAGE_DATA_URL.test(value) ? value : undefined;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

/** 요소 편집값을 검사한다. 모르는 요소는 버리고, 이동은 ±2000px, 배율은 0.2~5 로 자른다. */
function sanitizeEdits(edits: unknown): SlideEdits[] | undefined {
  if (!Array.isArray(edits)) {
    return undefined;
  }
  return edits.slice(0, SLIDE_COUNT).map((slide: unknown) => {
    const clean: SlideEdits = {};
    if (!slide || typeof slide !== 'object') {
      return clean;
    }
    for (const id of ELEMENT_IDS) {
      const edit = (slide as Record<string, unknown>)[id];
      if (!edit || typeof edit !== 'object') {
        continue;
      }
      const { dx, dy, scale, hidden } = edit as Partial<Record<keyof ElementEdit, unknown>>;
      clean[id] = {
        dx: clamp(dx, -2000, 2000, 0),
        dy: clamp(dy, -2000, 2000, 0),
        scale: clamp(scale, 0.2, 5, 1),
        ...(hidden === true ? { hidden: true } : {}),
      };
    }
    return clean;
  });
}

/**
 * 요청에 실린 이미지(로고·썸네일)를 검사한다. data URL 이미지가 아니면 버린다 — 바깥 주소를
 * 이미지 생성기에 넘기면 서버가 그 주소로 요청을 보내고, 미리보기 SVG 에도 그대로 실린다.
 */
function sanitizeSpec(spec: CardSpec): CardSpec {
  const original = safeImage(spec.logo?.original);
  const photo = safeImage(spec.settings.photo?.dataUrl);
  return {
    ...spec,
    logo: original
      ? {
          original,
          white: safeImage(spec.logo?.white),
          black: safeImage(spec.logo?.black),
          aspect: spec.logo?.aspect,
        }
      : undefined,
    settings: {
      ...spec.settings,
      photo: photo && spec.settings.photo ? { ...spec.settings.photo, dataUrl: photo } : undefined,
    },
    edits: sanitizeEdits(spec.edits),
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
  const { element, overflow } = buildSlide(
    sanitizeSpec(body.spec),
    body.slide,
    size,
    measure,
    assets,
  );

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
        // SVG 를 문서로 열어도 스크립트가 돌지 않게 잠근다. 미리보기는 <img> 로만 쓴다.
        'Content-Security-Policy':
          "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
        'X-Content-Type-Options': 'nosniff',
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
