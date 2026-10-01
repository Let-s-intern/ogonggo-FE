import { parse, type Font } from '@shuding/opentype.js';
import { loadFonts } from './assets';

/**
 * 글자 폭을 폰트 파일에서 잰다. 이미지 생성기는 넘친 글자를 자르지 않고 캔버스 밖으로 밀어내므로,
 * 그리기 전에 실제 폭으로 크기를 고른다. 폰트에 없는 글자(이모지)는 1em 으로 친다 — 이미지 생성기가
 * 이모지를 글자 크기만 한 그림으로 넣는다.
 */
export type Measure = (
  text: string,
  size: number,
  weight: number,
  letterSpacing?: number,
) => number;

let fontsPromise: Promise<Map<number, Font>> | null = null;

function loadParsed(): Promise<Map<number, Font>> {
  fontsPromise ??= loadFonts()
    .then((fonts) => new Map(fonts.map((font) => [font.weight, parse(font.data)] as const)))
    .catch((error: unknown) => {
      fontsPromise = null;
      throw error;
    });
  return fontsPromise;
}

/** 글자 하나의 폭(1px 글자 기준). 글자 크기를 고르며 같은 글자를 수천 번 재므로 기억해 둔다. */
const advanceCache = new Map<string, number>();

export async function loadMeasure(): Promise<Measure> {
  const fonts = await loadParsed();
  const advance = (char: string, weight: number): number => {
    const key = `${weight}:${char}`;
    let unit = advanceCache.get(key);
    if (unit === undefined) {
      const font = fonts.get(weight) ?? fonts.get(700);
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

/** 폭 `maxWidth` 상자에 넣었을 때의 줄 수. 한글은 음절 사이에서도 줄이 바뀌므로 글자 단위로 채운다. */
export function lineCount(
  measure: Measure,
  text: string,
  size: number,
  weight: number,
  maxWidth: number,
): number {
  let lines = 1;
  let width = 0;
  for (const char of text) {
    const advance = measure(char, size, weight);
    if (width + advance > maxWidth && width > 0) {
      lines += 1;
      width = char === ' ' ? 0 : advance;
    } else {
      width += advance;
    }
  }
  return lines;
}
