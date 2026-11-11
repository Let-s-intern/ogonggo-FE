/**
 * 검색 모달의 필터 칩. 칩은 Tab 으로만 생긴다 — 치는 중인 낱말에 맞는 선택지를 `completionsFor` 가 찾고, 모달이
 * Tab 을 받아 칩으로 넣는다. 띄어쓰기나 엔터가 낱말을 몰래 칩으로 바꾸지 않는다. 선택지는 FE 의 enum 카탈로그에서
 * 오므로 서버에 묻지 않는다.
 *
 * 글을 칩으로 읽는 것은 `지역:서울` 처럼 앞에 항목 이름을 직접 붙인 낱말뿐이다(`parseQuery`). 최근 검색도 이 꼴로
 * 적어 두었다가 다시 읽는다.
 */

/** 모달이 칩으로 바꿀 수 있는 필터 항목 하나. */
export interface SearchField {
  key: string;
  /** 칩과 `지역:` 접두어에 쓰는 짧은 이름. */
  label: string;
  /** `parent` 는 `parentField` 항목의 선택지 값이다(직무의 직군). */
  options: readonly { value: string; label: string; parent?: string }[];
  /** 이 항목의 선택지가 속한 상위 항목 키(직무 → 직군). */
  parentField?: string;
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

/** `지역:서울` 꼴의 낱말을 칩으로. 항목 이름이 없거나 맞는 선택지가 없으면 `undefined`. */
function prefixedToChip(fields: readonly SearchField[], token: string): SearchChip | undefined {
  const colon = token.indexOf(':');
  if (colon <= 0) return undefined;
  const field = findField(fields, token.slice(0, colon));
  const rest = token.slice(colon + 1);
  if (field?.freeform) return rest ? { field: field.key, value: decodeSpace(rest) } : undefined;
  const match = field ? matchOption(field, rest) : undefined;
  return field && match ? { field: field.key, value: match.value } : undefined;
}

/** 칩을 하나 더한다. 같은 값은 겹치지 않고, 하나만 받는 항목은 바꾼다. */
const sameChip = (a: SearchChip, b: SearchChip) => a.field === b.field && a.value === b.value;

/** 직무 칩의 직군 칩. 상위가 없으면 `undefined`. */
export function parentOf(fields: readonly SearchField[], chip: SearchChip): SearchChip | undefined {
  const field = fields.find((item) => item.key === chip.field);
  const parent = field?.options.find((option) => option.value === chip.value)?.parent;
  return field?.parentField && parent ? { field: field.parentField, value: parent } : undefined;
}

/** 직군 칩에 속한 직무 칩들. */
export function childrenOf(fields: readonly SearchField[], chip: SearchChip): SearchChip[] {
  return fields
    .filter((field) => field.parentField === chip.field)
    .flatMap((field) =>
      field.options
        .filter((option) => option.parent === chip.value)
        .map((option) => ({ field: field.key, value: option.value })),
    );
}

/**
 * 칩을 하나 더한다. 같은 값은 겹치지 않고, 하나만 받는 항목은 바꾼다. 직군과 그 직군의 직무는 함께 두지 않는다 —
 * 직군을 고르면 그 직군의 직무는 이미 다 고른 것이라 빠지고, 직무를 고르면 그 직군 통째 선택이 그 직무로 좁혀진다.
 */
export function addChip(
  fields: readonly SearchField[],
  chips: readonly SearchChip[],
  chip: SearchChip,
): SearchChip[] {
  const single = fields.find((field) => field.key === chip.field)?.single;
  const parent = parentOf(fields, chip);
  const rest = chips.filter(
    (item) =>
      !(item.field === chip.field && (single || item.value === chip.value)) &&
      !(parent && sameChip(item, parent)) &&
      !(parentOf(fields, item) && sameChip(parentOf(fields, item) as SearchChip, chip)),
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
/**
 * 맞은 직군 바로 아래에 그 직군의 직무를 펼친다. `마케팅` 을 치면 `직군 마케팅·광고` 와 그 직군의 직무가 나온다.
 * 다른 후보는 `limit` 개까지, 펼친 직무는 그와 따로 센다.
 */
const MAX_CHILDREN = 8;

export function completionsFor(
  fields: readonly SearchField[],
  token: string,
  limit: number,
): SearchChip[] {
  if (token === '') return [];
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
  const top = ranked
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map((item) => item.chip);
  const result: SearchChip[] = [];
  for (const chip of top) {
    if (result.some((item) => sameChip(item, chip))) continue;
    result.push(chip);
    // 펼치는 것은 이름이 친 글자로 시작하는 직군뿐이다. 글자를 담기만 한 직군까지 펼치면 목록이 넘친다.
    const children = childrenOf(fields, chip);
    if (children.length > 0 && target !== '') {
      for (const child of children.slice(0, MAX_CHILDREN)) {
        if (!result.some((item) => sameChip(item, child))) result.push(child);
      }
    }
  }
  return result;
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

/** 글 전체를 칩과 검색어로. `지역:서울` 꼴만 칩이 되고 나머지는 검색어다. 최근 검색을 다시 읽을 때와 엔터를 칠 때 쓴다. */
export function parseQuery(
  fields: readonly SearchField[],
  text: string,
  chips: readonly SearchChip[] = [],
): { chips: SearchChip[]; words: string[] } {
  let next = [...chips];
  const words: string[] = [];
  for (const token of text.split(/\s+/).filter(Boolean)) {
    const chip = prefixedToChip(fields, token);
    if (chip) next = addChip(fields, next, chip);
    else words.push(token);
  }
  return { chips: next, words };
}
