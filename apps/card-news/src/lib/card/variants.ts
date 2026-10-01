import { contrastRatio, luminance, mix, readableText } from './color';
import type { CardImage, CardSettings, VariantId } from './types';

/**
 * 시안 목록과 시안마다의 색. 렌더(서버)와 편집 화면(브라우저)이 같이 쓴다.
 *
 * 시안을 하나 더하려면 여기 `VARIANTS` 에 한 줄, `resolvePalette` 에 한 갈래, 렌더 쪽
 * `render/backgrounds.tsx` 에 배경 하나를 더한다. 배치(`open`·`panel`·`tab`)는 기존 것을 고른다.
 */

/**
 * 섹션을 어떻게 놓는가. `open` 은 바탕에 바로, `panel` 은 반투명 흰 판 안에, `tab` 은 로고 탭이
 * 달린 큰 흰 카드 안에(카카오스타일 예시).
 */
export type VariantLayout = 'open' | 'panel' | 'tab';

export interface VariantDefinition {
  id: VariantId;
  label: string;
  description: string;
  layout: VariantLayout;
  /** 이 시안이 쓰는 배경 이미지. 없으면 이미지 없이 그린다. */
  image?: 'photo' | 'building';
}

export const VARIANTS: VariantDefinition[] = [
  { id: 'wave', label: '브랜드색 물결', description: '로고 색 바탕에 밝은 물결', layout: 'open' },
  {
    id: 'watermark',
    label: '렛츠커리어 워터마크',
    description: '연한 바탕에 렛츠커리어 심볼을 크게 흐리게',
    layout: 'open',
  },
  {
    id: 'photo',
    label: '관련 이미지',
    description: '연한 바탕에 이미지를 흐리게. 글자색은 밝기로 자동',
    layout: 'open',
    image: 'photo',
  },
  {
    id: 'building',
    label: '회사 건물',
    description: '위는 밝게, 아래에 건물 사진, 목록은 흰 판 안에',
    layout: 'panel',
    image: 'building',
  },
  {
    id: 'tab',
    label: '로고 탭 카드',
    description: '브랜드색 바탕에 로고 탭이 달린 큰 흰 카드',
    layout: 'tab',
  },
];

export const VARIANT_IDS = VARIANTS.map((variant) => variant.id);

export function variantOf(id: VariantId): VariantDefinition {
  return VARIANTS.find((variant) => variant.id === id) ?? VARIANTS[0]!;
}

export interface Palette {
  /** 바탕 기본색. 이미지·물결은 이 위에 얹는다. */
  background: string;
  /** 제목·뱃지 줄의 글자색. */
  headlineText: string;
  /** 목록 글자색. */
  bodyText: string;
  /** 3장 글자색. 탭 시안은 1·2장 글자가 흰 카드 위라 3장(브랜드색 바탕)과 다르다. */
  ctaText: string;
  box: string;
  boxText: string;
  chip: string;
  chipText: string;
  /** 탭 시안 1장의 목록 테두리. */
  border: string;
  /** `~단어~` 글자색. */
  accent: string;
  /** 뱃지(`오늘의 공고 속보`). */
  badge: string;
  badgeText: string;
  /** 회사 로고를 어느 판으로 그리는가. */
  logo: 'original' | 'white' | 'black' | 'plate';
  /** 렛츠커리어 심볼 색. `color` 는 파랑 그라데이션. */
  mark: 'color' | 'white';
  /** `LETS CAREER` 글자색. */
  markText: string;
}

const INK = '#111111';
const WHITE = '#FFFFFF';
const MARK_TEXT = '#3E4A5F';

function highlightBase(settings: CardSettings): string {
  switch (settings.highlight) {
    case 'tint':
      return mix(settings.brandColor, WHITE, 0.72);
    case 'brand':
      return settings.brandColor;
    case 'black':
      return INK;
    case 'custom':
      return settings.highlightColor;
  }
}

/** 상자가 바탕에 묻히면(대비 1.35 미만) 글자색 쪽 색(검정·흰색)으로 바꾼다. */
function visibleOn(box: string, background: string, text: string): string {
  return contrastRatio(box, background) < 1.35 ? (text === WHITE ? WHITE : INK) : box;
}

function logoFor(settings: CardSettings, onBrand: boolean, text: string): Palette['logo'] {
  switch (settings.logoStyle) {
    case 'original':
      return 'original';
    case 'plate':
      return 'plate';
    case 'mono':
      return text === WHITE ? 'white' : 'black';
    case 'auto':
      // 브랜드색 바탕에서 원래 색 로고는 묻히고, 한 색으로 칠하면 로고 느낌이 사라진다. 원래 색 그대로
      // 흰 판 위에 올린다.
      return onBrand ? 'plate' : 'original';
  }
}

/**
 * 연한 바탕에 이미지를 `opacity` 로 얹었을 때 그 자리의 밝기. 바탕 밝기와 이미지 밝기를 진하기로
 * 섞는다 — 이미지를 진하게 올리면 글자색이 저절로 흰색으로 바뀐다.
 */
function blendedTone(background: string, image: CardImage | undefined, part: 'top' | 'bottom') {
  const base = luminance(background) ** (1 / 2.2);
  return image ? base * (1 - image.opacity) + image.tone[part] * image.opacity : base;
}

/**
 * 브랜드색 바탕 위 글자색. 흰 글자와 대비가 3 이상이면 흰색이다 — 초록(DB)·파랑(토스)처럼 중간 밝기
 * 색에서 검은 글자가 나오면 탁해 보인다. 노랑·민트처럼 밝은 색만 검은 글자다.
 */
export function textOnBrand(brand: string): string {
  return contrastRatio(brand, WHITE) >= 3 ? WHITE : INK;
}

/** 브랜드색 바탕 위 렛츠커리어 심볼. 흰색이 묻힐 만큼 밝은 바탕이면 파랑. */
function markOn(background: string): Pick<Palette, 'mark' | 'markText'> {
  return contrastRatio(background, WHITE) < 1.3
    ? { mark: 'color', markText: MARK_TEXT }
    : { mark: 'white', markText: WHITE };
}

export function resolvePalette(id: VariantId, settings: CardSettings): Palette {
  const brand = settings.brandColor;
  const base = highlightBase(settings);

  if (id === 'wave') {
    const text = textOnBrand(brand);
    const box = visibleOn(base, brand, text);
    return {
      background: brand,
      headlineText: text,
      bodyText: text,
      ctaText: text,
      box,
      boxText: readableText(box),
      chip: box,
      chipText: readableText(box),
      border: box,
      accent: text === WHITE ? mix(brand, WHITE, 0.45) : INK,
      badge: INK,
      badgeText: WHITE,
      logo: logoFor(settings, true, text),
      mark: text === WHITE ? 'white' : 'color',
      markText: text === WHITE ? WHITE : MARK_TEXT,
    };
  }

  if (id === 'tab') {
    // 1·2장 글자는 흰 카드 위, 3장은 브랜드색 바탕 위다.
    const box = visibleOn(base, WHITE, INK);
    return {
      background: brand,
      headlineText: INK,
      bodyText: INK,
      ctaText: textOnBrand(brand),
      box,
      boxText: readableText(box),
      chip: box,
      chipText: readableText(box),
      border: mix(brand, WHITE, 0.45),
      accent: contrastRatio(brand, WHITE) >= 3 ? brand : INK,
      badge: INK,
      badgeText: WHITE,
      logo: logoFor(settings, false, INK),
      ...markOn(brand),
    };
  }

  if (id === 'photo') {
    const background = mix(brand, WHITE, 0.9);
    const headlineText = blendedTone(background, settings.photo, 'top') > 0.55 ? INK : WHITE;
    const bodyText = blendedTone(background, settings.photo, 'bottom') > 0.55 ? INK : WHITE;
    const box = visibleOn(base, background, headlineText);
    return {
      background,
      headlineText,
      bodyText,
      ctaText: headlineText,
      box,
      boxText: readableText(box),
      chip: box,
      chipText: readableText(box),
      border: box,
      accent: headlineText === WHITE ? mix(brand, WHITE, 0.45) : brand,
      badge: INK,
      badgeText: WHITE,
      logo: logoFor(settings, false, headlineText),
      mark: bodyText === WHITE ? 'white' : 'color',
      markText: bodyText === WHITE ? WHITE : MARK_TEXT,
    };
  }

  // 밝은 바탕 시안(워터마크·건물).
  const background = id === 'watermark' ? mix(brand, WHITE, 0.9) : '#F4F5F7';
  const box = visibleOn(base, background, INK);
  return {
    background,
    headlineText: INK,
    bodyText: INK,
    ctaText: INK,
    box,
    boxText: readableText(box),
    chip: box,
    chipText: readableText(box),
    border: box,
    accent: contrastRatio(brand, background) >= 3 ? brand : INK,
    badge: INK,
    badgeText: WHITE,
    logo: logoFor(settings, false, INK),
    mark: id === 'building' && settings.building ? 'white' : 'color',
    markText: id === 'building' && settings.building ? WHITE : MARK_TEXT,
  };
}

/** 시안이 쓰는 이미지. 설정에 이미지가 없으면 `undefined`. */
export function variantImage(id: VariantId, settings: CardSettings): CardImage | undefined {
  const image = variantOf(id).image;
  return image ? settings[image] : undefined;
}
