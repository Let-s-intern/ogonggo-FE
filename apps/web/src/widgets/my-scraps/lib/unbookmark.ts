import {
  deleteBootcampBookmark,
  deleteJobBookmark,
  deleteRecruitmentPostBookmark,
} from '@ogonggo/api';
import type { MyScrapTab } from './query';

/**
 * 스크랩 해제(PRD 2 절). 탭마다 경로가 다르다 — 북마크를 만든 자원이 다르기 때문이고,
 * `/me/` 아래로 통일돼 있지도 않다(`DELETE /api/v1/job-bookmarks/{jobId}`,
 * `DELETE /api/v1/bootcamp-bookmarks/{bootcampId}`,
 * `DELETE /api/v1/recruitment-posts/{postId}/bookmarks/me`). 백엔드가 그런 것이고 고치지
 * 않는다 — 호출부가 헷갈리지 않게 이 한 곳에 모은다.
 */
export async function unbookmark(tab: MyScrapTab, id: number): Promise<void> {
  switch (tab) {
    case 'jobs':
      await deleteJobBookmark(id);
      return;
    case 'bootcamps':
      await deleteBootcampBookmark(id);
      return;
    case 'side-studies':
      await deleteRecruitmentPostBookmark(id);
      return;
  }
}
