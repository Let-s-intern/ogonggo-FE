/**
 * `스크랩 공고만` 알약(`bookmarkedOnly`, `./query.ts`)이 켜졌을 때 격자에 그릴 항목을 거른다.
 *
 * 서버 응답의 `item.bookmarked` 는 로그인 여부와 무관하게 늘 `false` 다 — 달력을 받는 서버
 * 컴포넌트가 토큰을 모른다(`./query.ts`의 `bookmarkedOnly` 주석). 그래서 그 값이 아니라
 * 브라우저가 가진 내 북마크 id 모음으로 거른다 — 카드 아이콘이 `useMyBookmarkIds` 로 서버 값을
 * 덮어쓰는 것과 같은 자리다.
 */
export function filterBookmarkedOnly<T extends { id: number }>(
  items: T[],
  bookmarkedOnly: boolean,
  bookmarkedIds: ReadonlySet<number> | undefined,
): T[] {
  if (!bookmarkedOnly) {
    return items;
  }
  /*
   * `bookmarkedIds` 가 `undefined` 인 동안은 아직 모르거나(로딩) 부를 수 없는 상태(비로그인·
   * 기업 회원, `useBookmarkAccess`)다. 알 수 없는 것을 "스크랩 아님"으로 다루는 편이
   * 안전하다 — 전부 뺀다. 알약 자체가 그 상태에서는 보이지 않으므로
   * (`ui/BookmarkedOnlyFilterPill.tsx`) 실사용에서는 이 가지에 닿지 않는다.
   */
  if (!bookmarkedIds) {
    return [];
  }
  return items.filter((item) => bookmarkedIds.has(item.id));
}
