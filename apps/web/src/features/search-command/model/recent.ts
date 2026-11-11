import type { SearchScope } from './suggest';

/**
 * 최근 검색. 이 브라우저에만 남는다(`localStorage`). 칩은 `지역:서울` 꼴로 적어 두어서 다시 고르면 같은
 * 칩과 검색어로 읽힌다(`parse.ts` 의 `chipToToken`). 저장소가 막혀 있으면 기억하지 않는다.
 */
const MAX_RECENT = 6;

const keyOf = (scope: SearchScope) => `ogonggo.web.recentSearch.${scope}`;

export function readRecent(scope: SearchScope): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(keyOf(scope)) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

export function pushRecent(scope: SearchScope, entry: string): void {
  if (entry.trim() === '') return;
  try {
    const next = [entry, ...readRecent(scope).filter((item) => item !== entry)].slice(
      0,
      MAX_RECENT,
    );
    localStorage.setItem(keyOf(scope), JSON.stringify(next));
  } catch {
    // 저장소가 막혀 있으면 기억하지 않는다.
  }
}

export function clearRecent(scope: SearchScope): void {
  try {
    localStorage.removeItem(keyOf(scope));
  } catch {
    // 저장소가 막혀 있으면 지울 것도 없다.
  }
}
