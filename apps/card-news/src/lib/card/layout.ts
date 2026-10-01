import { estimateEm, parseHeadline } from './markup';
import type { CardSection, CardSize } from './types';

/**
 * 장마다 글자 크기를 고른다. 이미지 생성기는 넘친 글자를 자르지 않고 캔버스 밖으로 밀어내므로,
 * 그리기 전에 들어갈 크기를 어림해 정한다. 폭은 `estimateEm` 의 어림이라 실제와 몇 % 어긋날 수
 * 있어 여유를 둔다.
 */

export const PAD_X = 76;
export const CONTENT_WIDTH = 1080 - PAD_X * 2;
const BULLET_INDENT = 40;

export interface SlideMetrics {
  /** 위·아래 여백. 스토리는 인스타 화면 요소가 덮는 위아래를 비운다. */
  padTop: number;
  padBottom: number;
  headlineSize: number;
  bodySize: number;
  /** 가장 작은 글자로도 넘치면 참이다. 편집 화면이 경고한다. */
  overflow: boolean;
}

const HEADER_HEIGHT = 110;
/** 하단 렛츠커리어 로고(64px)와 위쪽 숨 쉴 자리. */
const FOOTER_HEIGHT = 90;

export function headlineSizeFor(headline: string, max: number): number {
  const lines = parseHeadline(headline);
  // 상자 안쪽 여백(양옆 10px)만큼 한 줄의 폭이 늘어난다.
  const widest = Math.max(
    1,
    ...lines.map((line) => line.reduce((sum, segment) => sum + estimateEm(segment.text), 0) + 0.3),
  );
  return Math.round(Math.max(44, Math.min(max, CONTENT_WIDTH / widest)));
}

export function headlineHeight(headline: string, size: number): number {
  const count = Math.max(1, parseHeadline(headline).length);
  return count * size * 1.24 + (count - 1) * 14;
}

function sectionsHeight(sections: CardSection[], size: number, note: string): number {
  let height = 0;
  let count = 0;
  for (const section of sections) {
    const items = section.items.filter((item) => item.trim());
    if (items.length === 0) {
      continue;
    }
    count += 1;
    // 칩 높이(글자 + 위아래 여백 0.32em 씩)와 칩 아래 간격.
    height += size * 1.64 + 18;
    for (const item of items) {
      const lines = Math.ceil((estimateEm(item) * size) / (CONTENT_WIDTH - BULLET_INDENT));
      height += Math.max(1, lines) * size * 1.5;
    }
  }
  // 섹션 사이 간격. 마지막 섹션 뒤에는 없다.
  height += Math.max(0, count - 1) * 36;
  if (note.trim()) {
    const noteSize = size * 0.72;
    const lines = note
      .split('\n')
      .reduce(
        (sum, line) => sum + Math.max(1, Math.ceil((estimateEm(line) * noteSize) / CONTENT_WIDTH)),
        0,
      );
    height += lines * noteSize * 1.5;
  }
  return height;
}

const SINGLE_LINE_MIN = 28;

function allSingleLine(sections: CardSection[], size: number): boolean {
  return sections.every((section) =>
    section.items.every((item) => estimateEm(item) * size <= CONTENT_WIDTH - BULLET_INDENT),
  );
}

export function measureSlide(
  size: CardSize,
  headline: string,
  sections: CardSection[],
  note: string,
): SlideMetrics {
  const story = size.height > size.width * 1.5;
  const padTop = story ? 220 : 72;
  const padBottom = story ? 220 : 56;
  const headlineMax = size.height <= size.width ? 80 : 96;
  let headlineSize = headlineSizeFor(headline, headlineMax);
  const fixed = padTop + HEADER_HEIGHT + 52 + 56 + FOOTER_HEIGHT + padBottom;

  const bodyMax = story ? 38 : 34;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const available = size.height - fixed - headlineHeight(headline, headlineSize);
    // 먼저 항목이 모두 한 줄에 들어가는 크기를 찾는다. 한두 글자만 다음 줄로 넘어가는 모양이 글자가
    // 조금 작은 것보다 눈에 띈다. 28 아래로 내려가야 한다면 줄바꿈을 받아들인다.
    for (let bodySize = bodyMax; bodySize >= SINGLE_LINE_MIN; bodySize -= 1) {
      if (
        allSingleLine(sections, bodySize) &&
        sectionsHeight(sections, bodySize, note) <= available
      ) {
        return { padTop, padBottom, headlineSize, bodySize, overflow: false };
      }
    }
    for (let bodySize = bodyMax; bodySize >= 22; bodySize -= 1) {
      if (sectionsHeight(sections, bodySize, note) <= available) {
        return { padTop, padBottom, headlineSize, bodySize, overflow: false };
      }
    }
    // 본문이 가장 작아도 안 들어가면 제목을 한 번 줄여 본다.
    headlineSize = Math.max(44, Math.round(headlineSize * 0.82));
  }
  return { padTop, padBottom, headlineSize, bodySize: 22, overflow: true };
}
