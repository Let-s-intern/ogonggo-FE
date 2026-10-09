'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError, type PageInfo } from '@ogonggo/api';
import { useToast } from '@ogonggo/ui';
import { useSignedIn } from '@/shared/api/useSignedIn';
import {
  commentsKey,
  createComment,
  deleteComment,
  fetchReplies,
  fetchRootComments,
  repliesKey,
  reportComment,
  rootCommentsKey,
} from '../api/commentsApi';

/** 헤더 카드와 댓글 영역이 함께 보는 댓글 수의 캐시 키. */
function commentCountKey(postId: number) {
  return ['recruitment-post-comment-count', postId] as const;
}

/**
 * 모집글의 댓글 수(`commentCount`). 서버 렌더가 준 값에서 시작해 이 화면에서 쓰고 지운 만큼
 * ±1 한다. 헤더 카드의 개수와 댓글 영역 제목의 개수가 서로 다른 컴포넌트라, 둘이 같은 값을
 * 보도록 쿼리 캐시 한 칸을 저장소로 쓴다. 요청은 보내지 않는다(`queryFn` 은 받은 값을 돌려줄 뿐).
 *
 * 백엔드도 같은 규칙이다 — 작성(부모·대댓글 모두) 에 1 늘고, 삭제(부모·대댓글 모두) 에 1 준다.
 * 부모를 지워도 대댓글은 남으므로 대댓글 수만큼 더 빼지 않는다(생성 타입 설명).
 */
export function useCommentCount(postId: number, initialCount: number): number {
  const { data } = useQuery({
    queryKey: commentCountKey(postId),
    queryFn: () => initialCount,
    initialData: initialCount,
    staleTime: Infinity,
  });
  return data;
}

/** 다음 페이지 번호. `pageInfo.pageNum` 은 1 부터다(백엔드 `PageResponse.fromZeroBased`). */
function nextPage(pageInfo: PageInfo): number | undefined {
  return pageInfo.pageNum < pageInfo.totalPages ? pageInfo.pageNum + 1 : undefined;
}

/**
 * 부모 댓글 목록. `댓글 더보기` 로 다음 페이지를 이어 붙인다 — 사이드바의 좁은 칸이라 번호
 * 페이지네이션보다 이어 읽기가 맞고, 목업도 한 줄로 이어지는 목록이다.
 *
 * 브라우저에서만 부른다. `mine` 이 요청의 토큰으로 정해지는데 서버 컴포넌트의 요청에는 토큰이
 * 실리지 않는다(`shared/api/authTokens.ts`).
 */
export function useRootComments(postId: number) {
  const signedIn = useSignedIn();
  return useInfiniteQuery({
    queryKey: rootCommentsKey(postId, signedIn),
    queryFn: ({ pageParam }) => fetchRootComments(postId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => nextPage(last.pageInfo),
  });
}

/**
 * 미리보기 5 건 뒤의 대댓글. 미리보기가 1 페이지이므로 2 페이지부터 읽는다(`REPLY_PAGE_SIZE`).
 * `대댓글 더보기` 를 처음 누르기 전에는 부르지 않는다.
 */
export function useMoreReplies(postId: number, parentId: number, enabled: boolean) {
  const signedIn = useSignedIn();
  return useInfiniteQuery({
    queryKey: repliesKey(postId, parentId, signedIn),
    queryFn: ({ pageParam }) => fetchReplies(postId, parentId, pageParam),
    initialPageParam: 2,
    getNextPageParam: (last) => nextPage(last.pageInfo),
    enabled,
  });
}

/**
 * 작성·삭제·신고. 셋 다 응답에 새 목록이 없어(`id` 하나 또는 빈 본문) 성공하면 이 글의 댓글
 * 캐시를 통째로 무효화해 다시 읽는다. 먼저 바꿔 그리지 않는다 — 새 댓글의 작성자 닉네임·프로필과
 * 목록 속 위치를 화면이 지어낼 수 없다.
 *
 * 401 은 `shared/api/reissue.ts` 의 재발급 흐름이 먼저 받는다. 재발급까지 실패하면 그 흐름이
 * 로그인 화면으로 보낸다.
 */
export function useCommentActions(postId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const refresh = (countDelta: number) => {
    if (countDelta !== 0) {
      queryClient.setQueryData<number>(commentCountKey(postId), (count) =>
        Math.max(0, (count ?? 0) + countDelta),
      );
    }
    return queryClient.invalidateQueries({ queryKey: commentsKey(postId) });
  };

  const create = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: number }) =>
      createComment(postId, content, parentId),
    onSuccess: () => refresh(1),
    onError: (error) =>
      toast.show({ message: failureMessage(error, '댓글을 등록하지 못했어요'), tone: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (commentId: number) => deleteComment(postId, commentId),
    onSuccess: () => refresh(-1),
  });

  const report = useMutation({
    mutationFn: ({ commentId, reason }: { commentId: number; reason: string }) =>
      reportComment(postId, commentId, reason),
    onSuccess: () => toast.show({ message: '신고를 접수했어요' }),
  });

  return { create, remove, report };
}

/**
 * 실패 문구. 404 는 그 사이 지워진 댓글(대댓글을 달려던 부모 포함) 이거나 내려간 글이다.
 * 403 은 정지·탈퇴 계정이거나 남의 댓글을 지우려 한 경우다 — 백엔드가 주는 문구가 사유를
 * 가장 정확히 말하므로 본문의 `message` 를 그대로 쓴다.
 */
export function failureMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    if (error.status === 404) {
      return '이미 삭제된 댓글이거나 내려간 글이에요';
    }
    if (error.status === 403) {
      return readServerMessage(error.body) ?? fallback;
    }
  }
  return `${fallback}. 잠시 뒤 다시 시도해 주세요`;
}

function readServerMessage(body: string): string | null {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      const { message } = parsed as { message: unknown };
      return typeof message === 'string' && message ? message : null;
    }
  } catch {
    // 본문이 JSON 이 아니면(스프링의 평문 오류 등) 기본 문구로 떨어진다.
  }
  return null;
}
