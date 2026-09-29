import {
  createRecruitmentPostComment,
  deleteRecruitmentPostComment,
  getRecruitmentPostCommentReplies,
  getRecruitmentPostComments,
  reportRecruitmentPostComment,
  type PageInfo,
  type PageResponseRecruitmentPostCommentResponse,
  type PageResponseRecruitmentPostCommentRootResponse,
  type SuccessResponsePageResponseRecruitmentPostCommentResponse,
  type SuccessResponsePageResponseRecruitmentPostCommentRootResponse,
} from '@ogonggo/api';

/** 부모 댓글 한 번에 읽는 건수. 백엔드 기본값(10) 그대로다. 최대는 30 이다. */
export const COMMENT_PAGE_SIZE = 10;

/**
 * 대댓글 `더보기` 한 번에 읽는 건수. 부모 댓글 조회가 미리보기로 붙여 주는 건수(5, 백엔드
 * `REPLY_PREVIEW_SIZE`) 와 같아야 한다 — 그래야 미리보기가 곧 1 페이지이고 `더보기` 는 2 페이지부터
 * 이어 읽으면 겹치거나 빠지는 대댓글이 없다. 대댓글은 오래된 순이라 새 답글은 끝에 붙는다.
 */
export const REPLY_PAGE_SIZE = 5;

/**
 * 삭제된 부모 댓글의 `content`. **응답에 삭제 여부 필드가 없다** — 백엔드가 원문 대신 이 문구를
 * 넣어 줄 뿐이다(`RecruitmentPostCommentService.DELETED_COMMENT_CONTENT`, 생성 타입 설명의
 * `"삭제된 댓글입니다"`). 그래서 삭제 여부를 이 문구로 가린다. 사용자가 똑같은 문장을 써도 삭제된
 * 것으로 보이는 한계가 있고, 백엔드에 필드가 생기면 그것으로 바꾼다.
 *
 * 삭제된 대댓글은 응답에 오지 않는다(백엔드 쿼리가 `deletedAt IS NULL` 로 거른다). 이 문구로
 * 가리는 것은 부모 댓글뿐이다 — 부모를 지워도 대댓글은 남는다(LC-3309).
 */
export const DELETED_COMMENT_CONTENT = '삭제된 댓글입니다';

/**
 * 모집글 댓글 캐시의 공통 접두사. 작성·삭제 뒤 이것 하나로 부모 목록과 펼친 대댓글을 함께
 * 무효화한다.
 *
 * `signedIn` 을 키에 넣는다. 응답의 `mine`(내 댓글인지) 이 요청에 실린 토큰으로 정해지므로,
 * 로그인·로그아웃 전의 응답을 그대로 쓰면 남의 댓글에 삭제가 보이거나 내 댓글에 안 보인다.
 */
export function commentsKey(postId: number) {
  return ['recruitment-post-comments', postId] as const;
}

export function rootCommentsKey(postId: number, signedIn: boolean) {
  return [...commentsKey(postId), 'roots', signedIn] as const;
}

export function repliesKey(postId: number, parentId: number, signedIn: boolean) {
  return [...commentsKey(postId), 'replies', parentId, signedIn] as const;
}

/**
 * 부모 댓글 한 페이지(최신순). 각 부모에 대댓글 미리보기 5 건과 대댓글 전체 수가 붙어 온다.
 * 삭제된 부모도 대댓글을 품을 수 있어 목록에 남는다.
 *
 * 생성 함수의 반환 타입은 `{ data, status, headers }` 봉투지만 `httpClient` 는 본문을 그대로
 * 돌려준다 — 다른 기능의 호출과 같은 캐스팅이다. 2xx 가 아니면 `HttpError` 로 던진다.
 */
export async function fetchRootComments(
  postId: number,
  page: number,
): Promise<PageResponseRecruitmentPostCommentRootResponse> {
  const response = (await getRecruitmentPostComments(postId, {
    page,
    size: COMMENT_PAGE_SIZE,
  })) as unknown as SuccessResponsePageResponseRecruitmentPostCommentRootResponse;
  return response.data ?? emptyPage();
}

/** 한 부모의 대댓글 한 페이지(오래된 순). */
export async function fetchReplies(
  postId: number,
  parentId: number,
  page: number,
): Promise<PageResponseRecruitmentPostCommentResponse> {
  const response = (await getRecruitmentPostCommentReplies(postId, parentId, {
    page,
    size: REPLY_PAGE_SIZE,
  })) as unknown as SuccessResponsePageResponseRecruitmentPostCommentResponse;
  return response.data ?? emptyPage();
}

/** 댓글 작성. `parentId` 를 주면 대댓글이다 — 대댓글에 다시 답글은 달 수 없다(400). */
export async function createComment(
  postId: number,
  content: string,
  parentId?: number,
): Promise<void> {
  await createRecruitmentPostComment(postId, { content, parentId });
}

/** 댓글 삭제. 작성자 본인만 된다(403). 이미 지운 댓글은 404 다. */
export async function deleteComment(postId: number, commentId: number): Promise<void> {
  await deleteRecruitmentPostComment(postId, commentId);
}

/** 댓글 신고. 사유는 생략할 수 있고 같은 댓글을 여러 번 신고해도 막지 않는다(생성 타입 설명). */
export async function reportComment(
  postId: number,
  commentId: number,
  reason: string,
): Promise<void> {
  await reportRecruitmentPostComment(postId, commentId, reason ? { reason } : {});
}

function emptyPage<T>(): { items: T[]; pageInfo: PageInfo } {
  return { items: [], pageInfo: { pageNum: 1, pageSize: 0, totalElements: 0, totalPages: 0 } };
}
