import { parseHeadline } from './markup';
import { lineCount, type Measure } from './measure';
import type { CardSection, CardSize } from './types';

/**
 * 장마다 글자 크기와 간격을 고른다. 이미지 생성기는 넘친 글자를 자르지 않고 캔버스 밖으로
 * 밀어내므로, 그리기 전에 폰트 파일로 잰 폭(`./measure.ts`)으로 들어갈 크기를 정한다.
 *
 * 순서: 제목은 가장 긴 줄이 폭을 채우는 크기, 본문은 남은 높이에 들어가는 가장 큰 크기, 그러고도
 * 남는 높이는 간격을 늘려 채운다 — 예시 카드처럼 아래가 비어 보이지 않게.
 */

export const PAD_X = 76;
export const CONTENT_WIDTH = 1080 - PAD_X * 2;
export const BULLET_INDENT = 44;

export const HEADER_HEIGHT = 112;
/** 하단 렛츠커리어 로고(72px)와 위쪽 최소 여백. */
const FOOTER_HEIGHT = 72 + 36;

export const HEADLINE_WEIGHT = 800;
export const HEADLINE_LINE_HEIGHT = 1.2;
export const HEADLINE_TRACKING = -0.02;
/** 제목 줄 사이 간격(em). 검은 상자끼리 붙지 않을 만큼. */
export const HEADLINE_LINE_GAP = 0.1;
/** 검은 상자의 양옆 여백(em). */
export const BOX_PAD = 0.1;

export const BODY_WEIGHT = 600;
export const BODY_LINE_HEIGHT = 1.6;
export const CHIP_WEIGHT = 700;
export const NOTE_SCALE = 0.74;

export interface SlideMetrics {
  /** 섹션 목록의 폭. 판·프레임 안에 넣는 시안은 바깥 폭보다 좁다. */
  contentWidth: number;
  /** 위·아래 여백. 스토리는 인스타 화면 요소가 덮는 위아래를 비운다. */
  padTop: number;
  padBottom: number;
  headlineSize: number;
  bodySize: number;
  chipSize: number;
  /** 머리(뱃지·로고)와 제목 사이. */
  headlineGap: number;
  /** 제목과 첫 섹션 사이. */
  sectionsGap: number;
  /** 칩과 첫 항목 사이. */
  chipGap: number;
  /** 섹션 사이. */
  sectionGap: number;
  /** 가장 작은 글자로도 넘치면 참이다. 편집 화면이 경고한다. */
  overflow: boolean;
}

export function headlineWidth(measure: Measure, headline: string, size: number): number {
  return Math.max(
    0,
    ...parseHeadline(headline).map((line) =>
      line.reduce(
        (sum, segment) =>
          sum +
          measure(segment.text, size, HEADLINE_WEIGHT, size * HEADLINE_TRACKING) +
          (segment.style === 'box' ? size * BOX_PAD * 2 : 0),
        0,
      ),
    ),
  );
}

export function headlineSizeFor(measure: Measure, headline: string, max: number): number {
  // 폭은 글자 크기에 비례하므로 100px 에서 한 번 재고 비례로 구한다.
  const at100 = headlineWidth(measure, headline, 100);
  const fit = at100 > 0 ? (CONTENT_WIDTH / at100) * 100 : max;
  return Math.floor(Math.max(52, Math.min(max, fit)));
}

export function headlineHeight(headline: string, size: number): number {
  const count = Math.max(1, parseHeadline(headline).length);
  return count * size * HEADLINE_LINE_HEIGHT + (count - 1) * size * HEADLINE_LINE_GAP;
}

export function chipSizeFor(bodySize: number): number {
  return Math.round(bodySize * 1.04);
}

/** 칩 높이. 위아래 여백은 글자의 0.3em 씩이다. */
export function chipHeight(chipSize: number): number {
  return chipSize + Math.round(chipSize * 0.3) * 2;
}

function visibleSections(sections: CardSection[]): string[][] {
  return sections
    .map((section) => section.items.filter((item) => item.trim()))
    .filter((items) => items.length > 0);
}

interface Body {
  /** 간격을 뺀 높이(칩·항목·안내). */
  height: number;
  sectionCount: number;
  singleLine: boolean;
}

function bodyHeight(
  measure: Measure,
  sections: CardSection[],
  size: number,
  note: string,
  width: number,
): Body {
  const visible = visibleSections(sections);
  const itemWidth = width - BULLET_INDENT;
  let height = 0;
  let singleLine = true;
  for (const items of visible) {
    height += chipHeight(chipSizeFor(size));
    for (const item of items) {
      const lines = lineCount(measure, item, size, BODY_WEIGHT, itemWidth);
      singleLine &&= lines === 1;
      height += lines * size * BODY_LINE_HEIGHT;
    }
  }
  if (note.trim()) {
    const noteSize = Math.round(size * NOTE_SCALE);
    for (const line of note.split('\n')) {
      height += lineCount(measure, line, noteSize, 500, width) * noteSize * 1.5;
    }
  }
  return { height, sectionCount: visible.length, singleLine };
}

const BASE_HEADLINE_GAP = 48;
const BASE_SECTIONS_GAP = 64;

function baseGaps(size: number, body: Body, hasNote: boolean, withHeadline: boolean) {
  const chipGap = size * 0.5;
  const sectionGap = size * 1.0;
  const total =
    (withHeadline ? BASE_HEADLINE_GAP : 0) +
    BASE_SECTIONS_GAP +
    body.sectionCount * chipGap +
    Math.max(0, body.sectionCount - 1) * sectionGap +
    (hasNote ? chipGap : 0);
  return { chipGap, sectionGap, total };
}

export interface SlideBox {
  /** 제목. 도형 시안의 2장처럼 제목이 없으면 `null`. */
  headline: string | null;
  sections: CardSection[];
  note: string;
  /** 섹션 목록의 폭. */
  contentWidth: number;
  /** 판·프레임이 차지하는 고정 높이(안쪽 여백, 프레임 머리 등). */
  chrome: number;
  /** 하단 렛츠커리어 로고 자리를 두는가. */
  footer: boolean;
}

/** 위 여백. 스토리는 인스타 화면 요소가 덮는 위쪽을 비운다. */
function slidePadTop(size: CardSize): number {
  const story = size.height > size.width * 1.5;
  return story ? 230 : size.height <= size.width ? 56 : 72;
}

export function measureSlide(measure: Measure, size: CardSize, box: SlideBox): SlideMetrics {
  const { sections, note, contentWidth } = box;
  const headline = box.headline ?? '';
  const story = size.height > size.width * 1.5;
  const square = size.height <= size.width;
  const padTop = slidePadTop(size);
  const padBottom = story ? 230 : square ? 40 : 56;
  const headlineMax = square ? 92 : story ? 112 : 104;
  const bodyMax = square ? 36 : story ? 44 : 40;
  const fixed = padTop + HEADER_HEIGHT + (box.footer ? FOOTER_HEIGHT : 24) + padBottom + box.chrome;
  const hasNote = Boolean(note.trim());

  const withHeadline = box.headline !== null;
  const fullHeadline = withHeadline ? headlineSizeFor(measure, headline, headlineMax) : 0;
  // 높이가 모자라면 본문보다 제목을 먼저 줄인다 — 본문이 28px 아래로 내려가면 읽히지 않는다.
  // 단계마다 [제목 배율, 본문 최소 크기]. 마지막 단계만 본문을 22px 까지 내린다.
  const tiers: [number, number][] = [
    [1, 30],
    [0.86, 30],
    [0.74, 28],
    [0.74, 22],
  ];
  let headlineSize = fullHeadline;
  for (const [headlineScale, bodyMin] of tiers) {
    headlineSize = withHeadline ? Math.max(52, Math.round(fullHeadline * headlineScale)) : 0;
    const available =
      size.height - fixed - (withHeadline ? headlineHeight(headline, headlineSize) : 0);
    const fits = (bodySize: number, singleOnly: boolean) => {
      const body = bodyHeight(measure, sections, bodySize, note, contentWidth);
      const gaps = baseGaps(bodySize, body, hasNote, withHeadline);
      return (!singleOnly || body.singleLine) && body.height + gaps.total <= available
        ? { body, gaps }
        : null;
    };
    // 먼저 항목이 모두 한 줄에 들어가는 크기를 찾는다. 한두 글자만 다음 줄로 넘어가는 모양이 글자가
    // 조금 작은 것보다 눈에 띈다. 그래도 안 되면 줄바꿈을 받아들인다.
    let chosen: { bodySize: number; body: Body; gaps: ReturnType<typeof baseGaps> } | null = null;
    for (let bodySize = bodyMax; bodySize >= bodyMin && !chosen; bodySize -= 1) {
      const fit = fits(bodySize, true);
      chosen = fit ? { bodySize, ...fit } : null;
    }
    for (let bodySize = bodyMax; bodySize >= bodyMin && !chosen; bodySize -= 1) {
      const fit = fits(bodySize, false);
      chosen = fit ? { bodySize, ...fit } : null;
    }
    if (chosen) {
      // 남는 높이의 7할을 간격에 나눠 준다. 간격이 두 배를 넘으면 듬성해 보여 거기서 멈춘다.
      const slack = available - chosen.body.height - chosen.gaps.total;
      const scale = Math.min(2, 1 + (slack * 0.7) / chosen.gaps.total);
      return {
        contentWidth,
        padTop,
        padBottom,
        headlineSize,
        bodySize: chosen.bodySize,
        chipSize: chipSizeFor(chosen.bodySize),
        headlineGap: Math.round(BASE_HEADLINE_GAP * scale),
        sectionsGap: Math.round(BASE_SECTIONS_GAP * scale),
        chipGap: Math.round(chosen.gaps.chipGap * scale),
        sectionGap: Math.round(chosen.gaps.sectionGap * scale),
        overflow: false,
      };
    }
  }
  return {
    contentWidth,
    padTop,
    padBottom,
    headlineSize,
    bodySize: 22,
    chipSize: chipSizeFor(22),
    headlineGap: BASE_HEADLINE_GAP,
    sectionsGap: BASE_SECTIONS_GAP,
    chipGap: 11,
    sectionGap: 22,
    overflow: true,
  };
}
