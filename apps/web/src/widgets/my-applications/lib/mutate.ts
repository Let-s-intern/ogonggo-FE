import type { QueryClient } from '@tanstack/react-query';
import {
  deleteRecruitmentPostApplication,
  updateRecruitmentPostApplicationStatus,
  type UpdateRecruitmentApplicationStatusRequestApplicationStatus,
} from '@ogonggo/api';
import { deleteBookmark, myBookmarkIdsKey } from '@/features/bookmark';
import type { BookmarkApplicationTab } from './query';

/**
 * 사이드·스터디 지원 이력의 상태 변경과 삭제(v4 PRD 3 절). 둘 다 경로가
 * `/api/v1/me/recruitment-applications/{postId}` 로 같고 메서드만 다르다.
 *
 * **실제 지원서 처리 상태가 아니라 사용자의 개인 관리 상태다**(생성 타입 설명). 모집글
 * 작성자에게 보이는 지원자 정보는 바뀌지 않는다.
 */
export async function updateApplicationStatus(
  postId: number,
  applicationStatus: UpdateRecruitmentApplicationStatusRequestApplicationStatus,
): Promise<void> {
  await updateRecruitmentPostApplicationStatus(postId, { applicationStatus });
}

/** 지원 이력 삭제. 소프트 삭제라 다시 지원 링크를 열면 되살아난다(생성 타입 설명). */
export async function deleteApplication(postId: number): Promise<void> {
  await deleteRecruitmentPostApplication(postId);
}

/**
 * 채용공고·교육 부트캠프 탭의 삭제는 **북마크 해제**다. 그 두 탭의 행은 북마크 자체이고
 * (`fetchMyBookmarkApplications`), 지원 이력만 따로 지울 곳이 없다 — 해제하면 단계도 함께
 * 사라져 `스크랩한 공고` 에서도 빠진다.
 *
 * 푼 뒤 id 모음도 무효화한다. 목록·상세의 북마크 아이콘은 서버가 준 `bookmarked` 가 아니라 그
 * 모음을 보고 그리므로, 여기서 푼 항목은 돌아갔을 때 빈 아이콘이어야 한다 —
 * `widgets/my-scraps/lib/unbookmark.ts` 와 같은 이유다.
 */
export async function unbookmarkApplication(
  queryClient: QueryClient,
  tab: BookmarkApplicationTab,
  id: number,
): Promise<void> {
  await deleteBookmark(tab, id);
  await queryClient.invalidateQueries({ queryKey: myBookmarkIdsKey(tab) });
}
