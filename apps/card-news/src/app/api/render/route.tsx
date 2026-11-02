import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { loadEmoji, loadFonts } from '@/lib/card/assets';
import { SLIDE_ROLES } from '@/lib/card/document';
import { buildSlide } from '@/lib/card/render/slides';
import {
  BACKGROUND_PATTERNS,
  type BundleCard,
  type BundleCompany,
  CARD_SIZES,
  type CardBackground,
  type CardSection,
  type CardLogo,
  type CardSpec,
  type ElementEdit,
  LAYER_WEIGHTS,
  type Layer,
  type RenderRequest,
  type SlideEdits,
  isElementId,
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

/**
 * 요소 편집값을 검사한다. 모르는 요소(예전 편집본의 `sections` 포함)는 버리고, 이동은 ±2000px, 배율은
 * 0.2~5 로 자른다.
 */
function sanitizeEdits(edits: unknown): SlideEdits | undefined {
  if (!edits || typeof edits !== 'object' || Array.isArray(edits)) {
    return undefined;
  }
  const clean: SlideEdits = {};
  for (const [id, edit] of Object.entries(edits)) {
    if (!isElementId(id) || !edit || typeof edit !== 'object') {
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
}

/** 장 하나에 얹을 수 있는 자유 요소 수와 글자 요소의 글자 수. */
const MAX_LAYERS = 30;
const MAX_LAYER_TEXT = 1000;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * 자유 요소를 검사한다. 모양이 틀린 요소는 버리고, 수치는 범위로 자른다. 이미지는 로고와 같은 data
 * URL 규칙이다. 굵기는 글꼴 파일이 있는 값 가운데 가까운 것으로.
 */
function sanitizeLayers(layers: unknown): Layer[] | undefined {
  if (!Array.isArray(layers)) {
    return undefined;
  }
  return layers.slice(0, MAX_LAYERS).flatMap((raw: unknown): Layer[] => {
    if (!raw || typeof raw !== 'object') {
      return [];
    }
    const layer = raw as Record<string, unknown>;
    const base = {
      id: typeof layer.id === 'string' ? layer.id.slice(0, 40) : '',
      x: clamp(layer.x, -2000, 3000, 0),
      y: clamp(layer.y, -2000, 3000, 0),
      width: clamp(layer.width, 10, 3000, 400),
    };
    if (layer.kind === 'text' && typeof layer.text === 'string') {
      const weight = clamp(layer.fontWeight, 500, 900, 700);
      return [
        {
          ...base,
          kind: 'text',
          text: layer.text.slice(0, MAX_LAYER_TEXT),
          fontSize: clamp(layer.fontSize, 8, 400, 48),
          fontWeight: LAYER_WEIGHTS.reduce((best, value) =>
            Math.abs(value - weight) < Math.abs(best - weight) ? value : best,
          ),
          color:
            typeof layer.color === 'string' && HEX_COLOR.test(layer.color)
              ? layer.color
              : '#111111',
          align: layer.align === 'center' || layer.align === 'right' ? layer.align : 'left',
          lineHeight: clamp(layer.lineHeight, 0.8, 3, 1.3),
          // 채움(강조 상자·칩 모양). 없으면 채우지 않는다.
          ...(typeof layer.background === 'string' && HEX_COLOR.test(layer.background)
            ? { background: layer.background, radius: clamp(layer.radius, 0, 1000, 0) }
            : {}),
        },
      ];
    }
    const src = safeImage(layer.src);
    if (layer.kind === 'image' && src) {
      return [
        {
          ...base,
          kind: 'image',
          imageId: '',
          src,
          height: clamp(layer.height, 10, 3000, 400),
          opacity: clamp(layer.opacity, 0, 1, 1),
          radius: clamp(layer.radius, 0, 1000, 0),
        },
      ];
    }
    return [];
  });
}

/** 회사 블록의 회사 로고. 기업 로고와 같은 규칙이다. */
function sanitizeLogo(logo: CardLogo | undefined): CardLogo | undefined {
  const original = safeImage(logo?.original);
  return original
    ? {
        original,
        white: safeImage(logo?.white),
        black: safeImage(logo?.black),
        aspect: logo?.aspect,
      }
    : undefined;
}

/** 한 장에 놓는 회사 블록 수 상한. 섹션 요소 번호(1~9)를 넘지 않는다. */
const MAX_COMPANY_BLOCKS = 9;

/** 회사 블록을 검사한다. 글은 글자로 바꾸고, 로고는 data URL 이미지만 남긴다. */
function sanitizeCompanies(companies: unknown): BundleCompany[] | undefined {
  if (!Array.isArray(companies)) {
    return undefined;
  }
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const pair = (value: unknown): [string, string] =>
    Array.isArray(value) ? [text(value[0]), text(value[1])] : ['', ''];
  return companies.slice(0, MAX_COMPANY_BLOCKS).map((raw: unknown) => {
    const company = (raw ?? {}) as Partial<BundleCompany>;
    const logo = sanitizeLogo(company.logo);
    return {
      name: text(company.name),
      ...(logo ? { logo } : {}),
      columns: pair(company.columns),
      rows: Array.isArray(company.rows) ? company.rows.slice(0, 20).map(pair) : [],
    };
  });
}

/** 2열 카드를 검사한다. 글은 글자로 바꾸고 섹션·항목 수를 자른다. */
function sanitizeCards(cards: unknown): BundleCard[] | undefined {
  if (!Array.isArray(cards)) {
    return undefined;
  }
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const sections = (value: unknown): CardSection[] =>
    Array.isArray(value)
      ? value.slice(0, 4).map((raw: unknown) => {
          const section = (raw ?? {}) as Partial<CardSection>;
          return {
            label: text(section.label),
            items: Array.isArray(section.items) ? section.items.slice(0, 20).map(text) : [],
          };
        })
      : [];
  return cards.slice(0, MAX_COMPANY_BLOCKS).map((raw: unknown) => {
    const card = (raw ?? {}) as Partial<BundleCard>;
    return { title: text(card.title), left: sections(card.left), right: sections(card.right) };
  });
}

/** 덮어쓴 배경을 검사한다. 모르는 무늬·색이나 data URL 이 아닌 사진이면 버린다(시안 배경). */
function sanitizeBackground(background: unknown): CardBackground | undefined {
  const raw = (background ?? {}) as Record<string, unknown>;
  if (raw.kind === 'color' && typeof raw.color === 'string' && HEX_COLOR.test(raw.color)) {
    return { kind: 'color', color: raw.color };
  }
  const pattern = BACKGROUND_PATTERNS.find((item) => item.id === raw.pattern);
  if (raw.kind === 'pattern' && pattern) {
    return { kind: 'pattern', pattern: pattern.id };
  }
  const src = safeImage(raw.src);
  return raw.kind === 'photo' && src
    ? { kind: 'photo', src, opacity: clamp(raw.opacity, 0, 1, 1) }
    : undefined;
}

/**
 * 요청에 실린 이미지(로고·썸네일)를 검사한다. data URL 이미지가 아니면 버린다 — 바깥 주소를
 * 이미지 생성기에 넘기면 서버가 그 주소로 요청을 보내고, 미리보기 SVG 에도 그대로 실린다.
 */
function sanitizeSpec(spec: CardSpec): CardSpec {
  const photo = safeImage(spec.settings.photo?.dataUrl);
  const brandImage = safeImage(spec.settings.brandImage?.dataUrl);
  const brandAspect = Number(spec.settings.brandImage?.aspect);
  const background = sanitizeBackground(spec.settings.background);
  return {
    ...spec,
    logo: sanitizeLogo(spec.logo),
    settings: {
      ...spec.settings,
      photo: photo && spec.settings.photo ? { ...spec.settings.photo, dataUrl: photo } : undefined,
      brandImage:
        brandImage && brandAspect > 0.05 && brandAspect < 20
          ? { dataUrl: brandImage, aspect: brandAspect }
          : undefined,
      background,
    },
    edits: sanitizeEdits(spec.edits),
    layers: sanitizeLayers(spec.layers),
    bundleCompanies: sanitizeCompanies(spec.bundleCompanies),
    bundleCards: sanitizeCards(spec.bundleCards),
  };
}

/**
 * 카드 한 장을 PNG 로 그린다. 요청 하나가 장 하나다 — 장 종류(`role`)와 그 장의 편집값만 싣는다.
 * 미리보기와 다운로드가 같은 경로를 쓴다 — 미리보기에서 본 그대로
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
    !SLIDE_ROLES.includes(body.role)
  ) {
    return Response.json(
      { message: '시안, 크기, 장 종류 중 잘못된 값이 있습니다.' },
      { status: 400 },
    );
  }
  const scale = Math.min(1, Math.max(0.25, body.scale ?? 1));

  const [fonts, measure, assets] = await Promise.all([loadFonts(), loadMeasure(), loadAssets()]);
  const { element, overflow } = buildSlide(
    sanitizeSpec(body.spec),
    body.role,
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
