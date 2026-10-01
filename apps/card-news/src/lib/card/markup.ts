/**
 * 제목 강조 문법. `*배달의 민족*에서` 는 `배달의 민족` 을 검은 상자에, `~채용!~` 은 강조색 글자로
 * 그린다. 닫히지 않은 표시는 글자 그대로 둔다.
 */

export type SegmentStyle = 'plain' | 'box' | 'accent';

export interface Segment {
  text: string;
  style: SegmentStyle;
}

const MARKS: Record<string, SegmentStyle> = { '*': 'box', '~': 'accent' };

export function parseLine(line: string): Segment[] {
  const segments: Segment[] = [];
  let index = 0;
  let plain = '';
  while (index < line.length) {
    const char = line[index] as string;
    const style = MARKS[char];
    const close = style ? line.indexOf(char, index + 1) : -1;
    if (style && close > index + 1) {
      if (plain) {
        segments.push({ text: plain, style: 'plain' });
        plain = '';
      }
      segments.push({ text: line.slice(index + 1, close), style });
      index = close + 1;
      continue;
    }
    plain += char;
    index += 1;
  }
  if (plain) {
    segments.push({ text: plain, style: 'plain' });
  }
  return segments;
}

export function parseHeadline(headline: string): Segment[][] {
  return headline
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map(parseLine);
}

/** 강조 표시를 뺀 글자. */
export function stripMarkup(text: string): string {
  return parseHeadline(text)
    .map((line) => line.map((segment) => segment.text).join(''))
    .join('\n');
}

/**
 * 글자 폭을 em 으로 어림한다. 한글·한자는 0.98(Pretendard 굵은 체 실측), 영문 대문자는 0.74, 소문자·숫자는 0.6, 공백·문장부호는 0.3 이다. 실제
 * 폭을 재지 않고 글자 크기를 고르는 데만 쓴다(`./layout.ts`).
 */
export function estimateEm(text: string): number {
  let em = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 0x1100 && code <= 0xffdc && !(code >= 0x2000 && code <= 0x2bff)) {
      em += 0.98;
    } else if (/[A-Z]/.test(char)) {
      em += 0.74;
    } else if (/[a-z0-9]/.test(char)) {
      em += 0.6;
    } else if (code > 0xffff) {
      em += 1.1;
    } else {
      em += 0.32;
    }
  }
  return em;
}
