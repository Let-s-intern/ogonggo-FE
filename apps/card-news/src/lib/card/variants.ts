import { contrastRatio, mix, readableText } from './color';
import type { CardImage, CardSettings, VariantId } from './types';

/**
 * 시안 목록과 시안마다의 색. 렌더(서버)와 편집 화면(브라우저)이 같이 쓴다.
 *
 * 시안을 하나 더하려면 여기 `VARIANTS` 에 한 줄, `resolvePalette` 에 한 갈래, 렌더 쪽
 * `render/backgrounds.tsx` 에 배경 하나를 더한다. 배치(`open`·`panel`·`tab`)는 기존 것을 고른다.
 */

/**
 * 섹션을 어떻게 놓는가. `open` 은 바탕에 바로, `panel` 은 흰 판 안에, `tab` 은 로고 탭이 달린 큰
 * 흰 카드 안에(카카오스타일 예시), `labels` 는 가운데 로고·브랜드색 머리 카드·왼쪽 항목명 표(LG생활건강
 * 예시 2장).
 */
export type VariantLayout = 'open' | 'panel' | 'tab' | 'labels';

export interface VariantDefinition {
  id: VariantId;
  label: string;
  description: string;
  /** 1장(과 `detailLayout` 이 없으면 2장)의 배치. */
  layout: VariantLayout;
  /** 2장만 다른 배치로 그릴 때. */
  detailLayout?: VariantLayout;
  /**
   * 썸네일(`settings.photo`)을 어떻게 쓰는가. `background` 는 배경으로 깔고, `card` 는 2장의 제목
   * 자리에 둥근 카드로 통째로 보여 준다. 썸네일이 없으면 이미지 없이 그린다.
   */
  image?: 'background' | 'card';
}

/** 처음 여는 시안. 공고 썸네일이 들어가는 LG생활건강형이다. */
export const DEFAULT_VARIANT: VariantId = 'thumb';

export const VARIANTS: VariantDefinition[] = [
  {
    id: 'thumb',
    label: '썸네일 + 흰 판',
    description: '아래쪽에 썸네일, 목록은 흰 판 안. 2장은 항목명 표',
    layout: 'panel',
    detailLayout: 'labels',
    image: 'background',
  },
  {
    id: 'thumbFade',
    label: '썸네일 연하게',
    description: '연한 바탕에 썸네일을 흐리게 깔기',
    layout: 'open',
    image: 'background',
  },
  {
    id: 'thumbDark',
    label: '썸네일 어둡게',
    description: '썸네일 위를 어둡게 덮고 흰 글자',
    layout: 'open',
    image: 'background',
  },
  {
    id: 'thumbCard',
    label: '썸네일 카드',
    description: '2장 제목 자리에 썸네일을 잘리지 않게 카드로',
    layout: 'open',
    image: 'card',
  },
  { id: 'wave', label: '브랜드색 물결', description: '로고 색 바탕에 밝은 물결', layout: 'open' },
  {
    id: 'watermark',
    label: '렛츠커리어 워터마크',
    description: '연한 바탕에 렛츠커리어 심볼을 크게 흐리게',
    layout: 'open',
  },
  {
    id: 'frame',
    label: '브랜드색 테두리',
    description: '브랜드색 테두리 안에 흰 카드',
    layout: 'open',
  },
  {
    id: 'panel',
    label: '흰 판 목록',
    description: '연한 회색 바탕에 렛츠커리어 심볼, 목록은 흰 판 안에',
    layout: 'panel',
  },
  {
    id: 'tab',
    label: '로고 탭 카드',
    description: '브랜드색 바탕에 로고 탭이 달린 큰 흰 카드',
    layout: 'tab',
  },
  {
    id: 'dark',
    label: '다크',
    description: '검정 바탕에 브랜드색 강조',
    layout: 'open',
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
    // 로고 색 그대로는 너무 진해 흰색을 조금 섞는다.
    const background = mix(brand, WHITE, 0.15);
    const text = textOnBrand(background);
    const box = visibleOn(base, background, text);
    return {
      background,
      headlineText: text,
      bodyText: text,
      ctaText: text,
      box,
      boxText: readableText(box),
      chip: box,
      chipText: readableText(box),
      border: box,
      accent: text === WHITE ? mix(brand, WHITE, 0.55) : INK,
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

  if (id === 'thumbDark' || id === 'dark') {
    // 어두운 바탕 시안. 썸네일 어둡게는 썸네일 위를 검정으로 덮는다(현대자동차 예시).
    const background = id === 'dark' ? '#121212' : '#1A1A1A';
    const box = visibleOn(base, background, WHITE);
    const chip = id === 'thumbDark' ? WHITE : box;
    return {
      background,
      headlineText: WHITE,
      bodyText: WHITE,
      ctaText: WHITE,
      box,
      boxText: readableText(box),
      chip,
      chipText: readableText(chip),
      border: box,
      accent: mix(brand, WHITE, 0.4),
      badge: WHITE,
      badgeText: INK,
      logo: logoFor(settings, true, WHITE),
      mark: 'white',
      markText: WHITE,
    };
  }

  // 밝은 바탕 시안(썸네일 + 흰 판·썸네일 연하게·썸네일 카드·워터마크·테두리·흰 판).
  const background =
    id === 'frame'
      ? WHITE
      : id === 'watermark' || id === 'thumbFade'
        ? mix(brand, WHITE, 0.9)
        : '#F4F5F7';
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
    mark: 'color',
    markText: MARK_TEXT,
  };
}

/** 시안이 쓰는 썸네일. 설정에 없으면 `undefined`. */
export function variantImage(id: VariantId, settings: CardSettings): CardImage | undefined {
  return variantOf(id).image ? settings.photo : undefined;
}
