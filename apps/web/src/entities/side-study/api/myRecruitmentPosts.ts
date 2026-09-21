import {
  closeMyRecruitmentPost,
  copyMyRecruitmentPost,
  createRecruitmentPost,
  deleteMyRecruitmentPost,
  getMyRecruitmentPostForm,
  listMyRecruitmentPosts,
  reopenMyRecruitmentPost,
  updateRecruitmentPost,
  type CreateRecruitmentPostRequest,
  type ListMyRecruitmentPostsParams,
  type PageResponseRecruitmentPostManagementItemResponse,
  type RecruitmentPostFormResponse,
  type SuccessResponsePageResponseRecruitmentPostManagementItemResponse,
  type SuccessResponseRecruitmentPostFormResponse,
  type UpdateRecruitmentPostRequest,
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
 * 여덟 줄이 모두 아래에 있다. 폼 조회·생성·수정 셋은 모집글 작성·수정 화면(PRD 5 절) 이
 * 생기면서 더해졌다.
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

/**
 * 작성 화면용 폼 전체(PRD 5 절). 내 글이면 `DRAFT`·`PUBLISHED`·`HIDDEN` 셋 다 읽는다.
 *
 * **`agreedToPolicy` 는 항상 `false` 로 온다**(생성 타입 설명). 저장된 값이 아니라 고정값이라,
 * 수정 화면은 동의 체크를 다시 받아야 한다.
 */
export async function fetchMyPostForm(
  postId: number,
): Promise<RecruitmentPostFormResponse | undefined> {
  const body = (await getMyRecruitmentPostForm(
    postId,
  )) as unknown as SuccessResponseRecruitmentPostFormResponse;
  return body.data;
}

/**
 * 새 글을 만든다. `saveMode` 가 `DRAFT` 면 제목만 필수이고 `PUBLISH` 면 게시 필수값 전부와
 * `agreedToPolicy=true` 가 필요하다(생성 타입 설명). 응답은 만들어진 글의 폼이다.
 */
export async function createMyPost(
  request: CreateRecruitmentPostRequest,
): Promise<RecruitmentPostFormResponse | undefined> {
  const body = (await createRecruitmentPost(
    request,
  )) as unknown as SuccessResponseRecruitmentPostFormResponse;
  return body.data;
}

/**
 * 기존 글을 고친다. **전체 수정이라 보내지 않은 칸은 비워진다**(생성 타입 설명) — 화면이
 * 읽어 온 값을 그대로 다시 실어야 한다.
 */
export async function updateMyPost(
  postId: number,
  request: UpdateRecruitmentPostRequest,
): Promise<RecruitmentPostFormResponse | undefined> {
  const body = (await updateRecruitmentPost(
    postId,
    request,
  )) as unknown as SuccessResponseRecruitmentPostFormResponse;
  return body.data;
}
