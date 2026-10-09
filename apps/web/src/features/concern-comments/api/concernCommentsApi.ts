import {
  listPublicConcernCommentReplies,
  listPublicConcernComments,
  type PageInfo,
  type PageResponseConcernCommentResponse,
  type PageResponseConcernCommentRootResponse,
  type SuccessResponsePageResponseConcernCommentResponse,
  type SuccessResponsePageResponseConcernCommentRootResponse,
} from '@ogonggo/api';

/** 답변(부모 댓글) 한 번에 읽는 건수. 최대는 30 이다. */
export const COMMENT_PAGE_SIZE = 10;

/**
 * 답글 `더보기` 한 번에 읽는 건수. 답변 조회가 앞쪽 답글로 붙여 주는 건수(5) 와 같아야 한다 — 그래야
 * 그 5 건이 곧 1 페이지이고 `더보기` 는 2 페이지부터 이어 읽어 겹치거나 빠지는 답글이 없다. 답글은
 * 오래된 순이라 새 답글은 끝에 붙는다.
 */
export const REPLY_PAGE_SIZE = 5;

/**
 * 삭제된 답변의 문구. 응답의 `deleted` 가 `true` 면 백엔드가 `content` 를 이 문구로 바꿔 준다.
 * 화면은 `content` 를 믿지 않고 `deleted` 로 가린 뒤 이 문구를 그린다.
 */
export const DELETED_COMMENT_CONTENT = '삭제된 댓글입니다';

/**
 * 이 고민글 답변 캐시의 공통 접두사. 작성·삭제 뒤 이것 하나로 답변 목록과 펼친 답글을 함께 무효화한다.
 *
 * `signedIn` 을 키에 넣는다. 응답의 `mine`·`liked` 가 요청에 실린 토큰으로 정해지므로 로그인·로그아웃 전의
 * 응답을 그대로 쓰면 남의 답변에 삭제가 보이거나 내가 누른 도움돼요가 안 보인다.
 */
export function concernCommentsKey(concernId: number) {
  return ['concern-comments', concernId] as const;
}

export function rootCommentsKey(concernId: number, signedIn: boolean) {
  return [...concernCommentsKey(concernId), 'roots', signedIn] as const;
}

export function repliesKey(concernId: number, parentId: number, signedIn: boolean) {
  return [...concernCommentsKey(concernId), 'replies', parentId, signedIn] as const;
}

/**
 * 답변 한 페이지(먼저 쓴 순). 각 답변에 앞쪽 답글 5 건과 답글 전체 수(`replies.pageInfo.totalElements`) 가
 * 붙어 온다. 삭제된 답변은 남은 답글이 있을 때만 목록에 있다.
 *
 * 생성 함수의 반환 타입은 `{ data, status, headers }` 봉투지만 `httpClient` 는 본문을 그대로 돌려준다 —
 * 다른 기능의 호출과 같은 캐스팅이다. 2xx 가 아니면 `HttpError` 로 던진다.
 */
export async function fetchRootComments(
  concernId: number,
  page: number,
): Promise<PageResponseConcernCommentRootResponse> {
  const response = (await listPublicConcernComments(concernId, {
    page,
    size: COMMENT_PAGE_SIZE,
  })) as unknown as SuccessResponsePageResponseConcernCommentRootResponse;
  return response.data ?? emptyPage();
}

/** 한 답변의 답글 한 페이지(오래된 순). */
export async function fetchReplies(
  concernId: number,
  parentId: number,
  page: number,
): Promise<PageResponseConcernCommentResponse> {
  const response = (await listPublicConcernCommentReplies(concernId, parentId, {
    page,
    size: REPLY_PAGE_SIZE,
  })) as unknown as SuccessResponsePageResponseConcernCommentResponse;
  return response.data ?? emptyPage();
}

function emptyPage<T>(): { items: T[]; pageInfo: PageInfo } {
  return { items: [], pageInfo: { pageNum: 1, pageSize: 0, totalElements: 0, totalPages: 0 } };
}
