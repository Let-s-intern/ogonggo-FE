/**
 * 검색 모달에 친 글을 필터 칩과 검색어로 나눈다. "서울 인턴 마케팅 삼성" 은 지역 서울 · 인턴 · 마케팅·광고 칩과
 * 검색어 "삼성" 이 된다. 선택지는 FE 의 enum 카탈로그에서 오므로 서버에 묻지 않는다.
 *
 * - `지역:서울` 처럼 앞에 항목 이름을 붙이면 그 항목에서만 찾는다.
 * - `"영업"` 처럼 따옴표로 감싸면 필터로 바꾸지 않고 검색어로 둔다.
 * - 선택지 이름 그대로(`신입`)가 `·` 로 나눈 조각(`신입·경력` 의 `신입`)보다 먼저다. 같은 점수면 항목 순서가 먼저인 쪽이다.
 */

/** 모달이 칩으로 바꿀 수 있는 필터 항목 하나. */
export interface SearchField {
  key: string;
  /** 칩과 `지역:` 접두어에 쓰는 짧은 이름. */
  label: string;
  options: readonly { value: string; label: string }[];
  /** 값을 하나만 받는다(지역). 새로 고르면 앞의 값을 바꾼다. */
  single?: boolean;
  /** 선택지 없이 아무 값이나 받는다(회사). `회사:고위드` 처럼 이름을 붙였을 때만 칩이 된다. */
  freeform?: boolean;
}

export interface SearchChip {
  field: string;
  value: string;
}

/** 항목 키 → 고른 값들. */
export type SearchFilters = Record<string, string[]>;

const normalize = (text: string) => text.toLowerCase().replace(/[·\s]/g, '');

/**
 * 선택지 이름으로 칠 수 있는 말들. 두 글자보다 짧은 조각은 뺀다 — `웹` 은 이름 그대로일 때만 맞는다.
 * `기타…` 선택지는 조각으로 맞추지 않는다. `데이터` 를 치면 검색어이지 `기타AI·데이터` 직무가 아니다.
 */
function aliasesOf(label: string): string[] {
  if (label.startsWith('기타')) return [];
  const pieces = label.split(/[·\s]/).filter((piece) => piece.length >= 2);
  return [...new Set(pieces.map(normalize))];
}

/** `token` 에 맞는 선택지. 이름 그대로면 2점, 조각이면 1점. */
function matchOption(
  field: SearchField,
  token: string,
): { value: string; score: number } | undefined {
  const target = normalize(token);
  if (target === '') return undefined;
  let best: { value: string; score: number } | undefined;
  for (const option of field.options) {
    const score =
      normalize(option.label) === target ? 2 : aliasesOf(option.label).includes(target) ? 1 : 0;
    if (score > (best?.score ?? 0)) best = { value: option.value, score };
  }
  return best;
}

function findField(fields: readonly SearchField[], prefix: string): SearchField | undefined {
  const target = normalize(prefix);
  return fields.find((field) => normalize(field.label) === target);
}

/** 낱말 하나를 칩으로 바꾼다. 못 바꾸면 `undefined`. */
export function tokenToChip(fields: readonly SearchField[], token: string): SearchChip | undefined {
  if (/^".*"$/.test(token)) return undefined;
  const colon = token.indexOf(':');
  if (colon > 0) {
    const field = findField(fields, token.slice(0, colon));
    const rest = token.slice(colon + 1);
    if (field?.freeform) return rest ? { field: field.key, value: decodeSpace(rest) } : undefined;
    const match = field ? matchOption(field, rest) : undefined;
    return field && match ? { field: field.key, value: match.value } : undefined;
  }
  let best: { chip: SearchChip; score: number } | undefined;
  for (const field of fields) {
    const match = matchOption(field, token);
    if (match && match.score > (best?.score ?? 0)) {
      best = { chip: { field: field.key, value: match.value }, score: match.score };
    }
  }
  return best?.chip;
}

/** 칩으로 못 바꾼 낱말은 검색어로 남긴다. 따옴표는 벗긴다. */
export function plainWord(token: string): string {
  return /^".*"$/.test(token) ? token.slice(1, -1) : token;
}

/** 칩을 하나 더한다. 같은 값은 겹치지 않고, 하나만 받는 항목은 바꾼다. */
export function addChip(
  fields: readonly SearchField[],
  chips: readonly SearchChip[],
  chip: SearchChip,
): SearchChip[] {
  const single = fields.find((field) => field.key === chip.field)?.single;
  const rest = chips.filter(
    (item) => !(item.field === chip.field && (single || item.value === chip.value)),
  );
  return [...rest, chip];
}

/** 이름 없는 값(회사)은 띄어쓰기를 `%20` 으로 적는다. 낱말을 띄어쓰기로 나누므로 그대로 두면 값이 쪼개진다. */
const encodeSpace = (value: string) => value.replace(/ /g, '%20');
export const decodeSpace = (value: string) => value.replace(/%20/g, ' ');

export function chipLabel(fields: readonly SearchField[], chip: SearchChip): string {
  const field = fields.find((item) => item.key === chip.field);
  if (field?.freeform) return chip.value;
  return field?.options.find((option) => option.value === chip.value)?.label ?? chip.value;
}

/**
 * 치는 중인 낱말에 맞는 선택지. `지역:` 처럼 항목을 붙였으면 그 항목 안에서, 아니면 모든 항목에서 이름이
 * 그 글자로 시작하거나 그 글자를 담은 것을 찾는다. 시작하는 것이 먼저다.
 */
export function completionsFor(
  fields: readonly SearchField[],
  token: string,
  limit: number,
): SearchChip[] {
  if (token === '' || token.startsWith('"')) return [];
  const colon = token.indexOf(':');
  const scoped = colon > 0 ? findField(fields, token.slice(0, colon)) : undefined;
  if (colon > 0 && !scoped) return [];
  const target = normalize(colon > 0 ? token.slice(colon + 1) : token);
  const pool = scoped ? [scoped] : fields;
  const ranked: { chip: SearchChip; rank: number }[] = [];
  for (const field of pool) {
    for (const option of field.options) {
      const name = normalize(option.label);
      const rank =
        target === ''
          ? 1
          : name.startsWith(target) || aliasesOf(option.label).some((a) => a.startsWith(target))
            ? 0
            : name.includes(target)
              ? 1
              : -1;
      if (rank >= 0) ranked.push({ chip: { field: field.key, value: option.value }, rank });
    }
  }
  return ranked
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map((item) => item.chip);
}

/** 칩을 `지역:서울` 꼴의 글로. 최근 검색에 적어 두었다가 같은 결과로 다시 읽는 데 쓴다. */
export function chipToToken(fields: readonly SearchField[], chip: SearchChip): string {
  const field = fields.find((item) => item.key === chip.field);
  if (!field) return '';
  return field.freeform
    ? `${field.label}:${encodeSpace(chip.value)}`
    : `${field.label}:${chipLabel(fields, chip).replace(/\s/g, '')}`;
}

export function chipsToFilters(fields: readonly SearchField[], chips: readonly SearchChip[]) {
  const filters: SearchFilters = Object.fromEntries(fields.map((field) => [field.key, []]));
  for (const chip of chips) filters[chip.field]?.push(chip.value);
  return filters;
}

export function filtersToChips(
  fields: readonly SearchField[],
  filters: SearchFilters | undefined,
): SearchChip[] {
  return fields.flatMap((field) =>
    (filters?.[field.key] ?? []).map((value) => ({ field: field.key, value })),
  );
}

/** 글 전체를 칩과 검색어로. 최근 검색을 다시 읽을 때와 엔터를 칠 때 쓴다. */
export function parseQuery(
  fields: readonly SearchField[],
  text: string,
  chips: readonly SearchChip[] = [],
): { chips: SearchChip[]; words: string[] } {
  let next = [...chips];
  const words: string[] = [];
  for (const token of text.split(/\s+/).filter(Boolean)) {
    const chip = tokenToChip(fields, token);
    if (chip) next = addChip(fields, next, chip);
    else words.push(plainWord(token));
  }
  return { chips: next, words };
}
