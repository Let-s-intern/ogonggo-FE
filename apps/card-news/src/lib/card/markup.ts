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
