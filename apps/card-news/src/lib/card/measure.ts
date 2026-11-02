import type { Font } from '@shuding/opentype.js';

/**
 * 글자 폭을 폰트 파일에서 잰다. 이미지 생성기는 넘친 글자를 자르지 않고 캔버스 밖으로 밀어내므로,
 * 그리기 전에 실제 폭으로 크기를 고른다. 폰트에 없는 글자(이모지)는 1em 으로 친다 — 이미지 생성기가
 * 이모지를 글자 크기만 한 그림으로 넣는다.
 *
 * 서버(렌더 라우트)와 브라우저(편집 캔버스)가 같은 함수를 쓴다. 폰트 파일을 읽는 일은 각자 한다
 * (`../server/measure.ts`, `../client/useRenderKit.ts`).
 */
export type Measure = (
  text: string,
  size: number,
  weight: number,
  letterSpacing?: number,
) => number;

/** 굵기별로 읽어 둔 폰트로 측정 함수를 만든다. 없는 굵기는 700 으로 잰다. */
export function createMeasure(fontsByWeight: Map<number, Font>): Measure {
  // 글자 하나의 폭(1px 글자 기준). 글자 크기를 고르며 같은 글자를 수천 번 재므로 기억해 둔다.
  const advanceCache = new Map<string, number>();
  const advance = (char: string, weight: number): number => {
    const key = `${weight}:${char}`;
    let unit = advanceCache.get(key);
    if (unit === undefined) {
      const font = fontsByWeight.get(weight) ?? fontsByWeight.get(700);
      unit = !font ? 0 : font.charToGlyphIndex(char) > 0 ? font.getAdvanceWidth(char, 1) : 1;
      advanceCache.set(key, unit);
    }
    return unit;
  };
  return (text, size, weight, letterSpacing = 0) => {
    let width = 0;
    let count = 0;
    for (const char of text) {
      count += 1;
      width += advance(char, weight) * size;
    }
    return width + letterSpacing * count;
  };
}

// 이미지 생성기(satori)는 `wordBreak: 'keep-all'` 에서 `Intl.Segmenter` 의 단어 조각 사이에서만 줄을 바꾼다.
// 같은 조각으로 줄 수를 세야 높이 계산이 그림과 맞는다.
const wordSegmenter = new Intl.Segmenter('ko', { granularity: 'word' });

function words(text: string): string[] {
  return Array.from(wordSegmenter.segment(text), (part) => part.segment);
}

/**
 * 글 상자의 `wordBreak`. 어절이 모두 `maxWidth` 안에 들면 `keep-all`(어절 단위로 줄바꿈), 하나라도 넘치면
 * `normal`(한글 글자 단위). 이미지 생성기는 `keep-all` 에서 긴 어절을 끊지 않고 상자 밖으로 밀어내므로 그때만
 * 글자 단위로 돌린다. 렌더와 `lineCount` 가 같은 판단을 쓴다.
 */
export function wordBreakFor(
  measure: Measure,
  text: string,
  size: number,
  weight: number,
  maxWidth: number,
): 'keep-all' | 'normal' {
  return words(text).every((word) => measure(word, size, weight) <= maxWidth)
    ? 'keep-all'
    : 'normal';
}

/**
 * 폭 `maxWidth` 상자에 넣었을 때의 줄 수. `wordBreakFor` 가 `keep-all` 이면 어절 단위로, 아니면 글자 단위로
 * 채운다(한글은 음절 사이에서도 줄이 바뀐다).
 */
export function lineCount(
  measure: Measure,
  text: string,
  size: number,
  weight: number,
  maxWidth: number,
): number {
  const keepWords = wordBreakFor(measure, text, size, weight, maxWidth) === 'keep-all';
  let lines = 1;
  let width = 0;
  for (const part of keepWords ? words(text) : text) {
    const advance = measure(part, size, weight);
    if (width + advance > maxWidth && width > 0) {
      lines += 1;
      width = part.trim() ? advance : 0;
    } else {
      width += advance;
    }
  }
  return lines;
}
