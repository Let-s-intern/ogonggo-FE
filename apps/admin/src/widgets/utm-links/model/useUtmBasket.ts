import { useState } from 'react';
import type { UtmPosting } from './utmLinks';

/** `base` 뒤에 `added` 를 붙인다. 같은 id 는 먼저 있던 것을 두고 순서를 지킨다. */
export function mergePostings(base: UtmPosting[], added: UtmPosting[]): UtmPosting[] {
  const ids = new Set(base.map((posting) => posting.id));
  const merged = [...base];
  for (const { id, title } of added) {
    if (!ids.has(id)) {
      ids.add(id);
      merged.push({ id, title });
    }
  }
  return merged;
}

/**
 * UTM 링크를 만들려고 담아 둔 공고. 목록의 체크(`useRowSelection`) 는 검색이 바뀌어 행이 달라지면 풀리지만
 * 이 목록은 남는다. 서로 다른 검색어로 찾은 공고 몇 개를 모아 한 번에 링크를 만들려는 것이다.
 *
 * 목록 화면 안에서만 산다. 상세로 갔다 오면 비워진다.
 */
export function useUtmBasket() {
  const [postings, setPostings] = useState<UtmPosting[]>([]);
  return {
    postings,
    add: (added: UtmPosting[]) => setPostings((current) => mergePostings(current, added)),
    remove: (id: number) =>
      setPostings((current) => current.filter((posting) => posting.id !== id)),
    clear: () => setPostings([]),
  };
}

export type UtmBasket = ReturnType<typeof useUtmBasket>;
