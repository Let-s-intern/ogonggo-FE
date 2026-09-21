import {
  closeMyRecruitmentPost,
  copyMyRecruitmentPost,
  deleteMyRecruitmentPost,
  listMyRecruitmentPosts,
  reopenMyRecruitmentPost,
  type ListMyRecruitmentPostsParams,
  type PageResponseRecruitmentPostManagementItemResponse,
  type SuccessResponsePageResponseRecruitmentPostManagementItemResponse,
  type SuccessResponseRecruitmentPostFormResponse,
} from '@ogonggo/api';

/**
 * 내가 쓴 모집글에 하는 호출을 모은 곳(PRD 4 절).
 *
 * **경로가 `/me/` 아래로 통일돼 있지 않다.** 백엔드가 그런 것이고 고치지 않는다. 호출부가
 * 매번 어느 쪽인지 헷갈리지 않도록 생성 함수를 부르는 자리를 여기 하나로 둔다.
 *
 * | 하는 일 | 생성 함수 | 경로 |
 * |---|---|---|
 * | 목록 | `listMyRecruitmentPosts` | `GET /api/v1/me/recruitment-posts` |
 * | 복사 | `copyMyRecruitmentPost` | `POST /api/v1/me/recruitment-posts/{postId}/copies` |
 * | 폼 조회 | `getMyRecruitmentPostForm` | `GET /api/v1/me/recruitment-posts/{postId}` |
 * | 생성 | `createRecruitmentPost` | `POST /api/v1/recruitment-posts` |
 * | 수정 | `updateRecruitmentPost` | `PUT /api/v1/recruitment-posts/{postId}` |
 * | 삭제 | `deleteMyRecruitmentPost` | `DELETE /api/v1/recruitment-posts/{postId}` |
 * | 마감 | `closeMyRecruitmentPost` | `PATCH /api/v1/recruitment-posts/{postId}/close` |
 * | 재모집 | `reopenMyRecruitmentPost` | `PATCH /api/v1/recruitment-posts/{postId}/reopen` |
 *
 * 표의 여덟 줄 중 다섯만 아래에 있다. 폼 조회·생성·수정은 모집글 작성·수정 화면(PRD 5 절) 의
 * 것이고 그 화면이 아직 없다 — 쓰는 곳이 없는 껍데기를 미리 두지 않는다. 그 화면이 생기면
 * **이 파일에 더한다.** 표에 여덟 줄을 다 적어 둔 이유가 그것이다.
 *
 * 생성 타입은 응답을 `{ data, status }` 로 감싼 모양이지만 `httpClient` 는 본문을 그대로
 * 돌려준다(`views/mypage/ui/MyPageLayout.tsx` 의 같은 주석). 그래서 한 번 단언한다.
 */

/** 목록 한 쪽. 필터·정렬·페이지는 모두 `params` 가 정한다. */
export async function fetchMyPosts(
  params: ListMyRecruitmentPostsParams,
): Promise<PageResponseRecruitmentPostManagementItemResponse | undefined> {
  const body = (await listMyRecruitmentPosts(
    params,
  )) as unknown as SuccessResponsePageResponseRecruitmentPostManagementItemResponse;
  return body.data;
}

/** 소프트 삭제. 이미 지운 글을 다시 지워도 성공한다(생성 타입 설명). */
export async function deleteMyPost(postId: number): Promise<void> {
  await deleteMyRecruitmentPost(postId);
}

/**
 * 새 `DRAFT` 글로 복사한다. 응답은 작성 화면용 폼이고, 거기서 **새 글의 `postId`** 만
 * 돌려준다 — 복사가 정말 새 글을 만들었는지는 이 값으로만 알 수 있다.
 */
export async function copyMyPost(postId: number): Promise<number | undefined> {
  const body = (await copyMyRecruitmentPost(
    postId,
  )) as unknown as SuccessResponseRecruitmentPostFormResponse;
  return body.data?.postId;
}

/** 수동 조기 마감. 이미 마감된 글에 다시 불러도 성공한다(생성 타입 설명). */
export async function closeMyPost(postId: number): Promise<void> {
  await closeMyRecruitmentPost(postId);
}

/** 재모집. 종료일이 오늘이거나 과거면 백엔드가 409 를 준다(생성 타입 설명). */
export async function reopenMyPost(postId: number): Promise<void> {
  await reopenMyRecruitmentPost(postId);
}
