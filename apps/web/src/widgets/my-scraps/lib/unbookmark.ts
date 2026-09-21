import type { QueryClient } from '@tanstack/react-query';
import { deleteBookmark, myBookmarkIdsKey } from '@/features/bookmark';
import type { MyScrapTab } from './query';

/**
 * 스크랩 해제(PRD 2 절). 탭마다 경로가 다르고 `/me/` 아래로 통일돼 있지도 않은데, 그것을 가르는
 * 일은 `features/bookmark/api/bookmarkApi.ts` 하나가 한다 — 해제 경로가 두 곳에 적혀 있으면
 * 한쪽만 고쳐지는 날이 온다. 탭 이름이 그대로 북마크 종류 이름이라(`BookmarkKind`) 옮길 것이
 * 없다.
 *
 * 푼 뒤 id 모음도 무효화한다. 목록·상세의 북마크 아이콘은 서버가 준 `bookmarked` 가 아니라 그
 * 모음을 보고 그리므로, 여기서 푼 항목은 돌아갔을 때 빈 아이콘이어야 한다.
 */
export async function unbookmark(
  queryClient: QueryClient,
  tab: MyScrapTab,
  id: number,
): Promise<void> {
  await deleteBookmark(tab, id);
  await queryClient.invalidateQueries({ queryKey: myBookmarkIdsKey(tab) });
}
