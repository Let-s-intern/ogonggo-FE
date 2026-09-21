import {
  deleteRecruitmentPostApplication,
  updateRecruitmentPostApplicationStatus,
  type UpdateRecruitmentApplicationStatusRequestApplicationStatus,
} from '@ogonggo/api';

/**
 * 사이드·스터디 지원 이력의 상태 변경과 삭제(PRD 3 절). 둘 다 경로가
 * `/api/v1/me/recruitment-applications/{postId}` 로 같고 메서드만 다르다.
 *
 * **실제 지원서 처리 상태가 아니라 사용자의 개인 관리 상태다**(생성 타입 설명). 모집글
 * 작성자에게 보이는 지원자 정보는 바뀌지 않는다.
 *
 * 채용공고·부트캠프 탭에는 이에 해당하는 API 가 없다. 그 탭의 컨트롤이 비활성인 이유이고,
 * 요청은 `.claude/tasks/memos/백엔드-요청-마이페이지.md` 2 번에 있다.
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
