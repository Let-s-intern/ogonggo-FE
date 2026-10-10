'use client';

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@ogonggo/ui';
import { concernCommentsKey, setCommentLike } from '../api/concernCommentsApi';
import { failureMessage } from './useConcernCommentActions';

/** 답변(`replies` 가 있다) 과 답글 모두 이 모양을 따른다. */
interface LikeableComment {
  id: number;
  liked: boolean;
  likeCount: number;
  replies?: { items: LikeableComment[] };
}

type CommentPages = InfiniteData<{ items: LikeableComment[] }>;

/**
 * 한 건의 도움돼요를 캐시 안에서 바꾼다. 답변 목록의 답변과 그 안의 앞쪽 답글, 펼친 답글 목록 어디에
 * 있든 같은 id 를 찾아 바꾼다. 이미 그 상태면 그대로 둔다(숫자를 두 번 세지 않는다).
 */
function patchLike(data: CommentPages | undefined, commentId: number, liked: boolean) {
  if (!data) {
    return data;
  }
  const patch = (comment: LikeableComment): LikeableComment => {
    const next =
      comment.id === commentId && comment.liked !== liked
        ? { ...comment, liked, likeCount: Math.max(0, comment.likeCount + (liked ? 1 : -1)) }
        : comment;
    return next.replies
      ? { ...next, replies: { ...next.replies, items: next.replies.items.map(patch) } }
      : next;
  };
  return { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.map(patch) })) };
}

/**
 * 도움돼요 토글. 누르는 순간 숫자와 색을 먼저 바꾸고(응답을 기다리면 눌렀는지 알 수 없다) 요청이 실패하면
 * 되돌린다. 끝나면 어느 쪽이든 다시 읽어 서버 값으로 맞춘다 — 그 사이 다른 사람이 누른 몫이 들어온다.
 *
 * 작성·삭제와 달리 먼저 바꿔 그려도 되는 이유는 화면이 지어낼 것이 없어서다. 바뀌는 것은 `liked` 와
 * `likeCount` 하나뿐이다.
 */
export function useCommentLike(concernId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const queryKey = concernCommentsKey(concernId);

  return useMutation({
    mutationFn: ({ commentId, liked }: { commentId: number; liked: boolean }) =>
      setCommentLike(concernId, commentId, liked),
    onMutate: async ({ commentId, liked }) => {
      // 진행 중인 목록 읽기가 먼저 바꾼 값을 옛 값으로 덮어쓰지 않게 멈춘다.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueriesData<CommentPages>({ queryKey });
      queryClient.setQueriesData<CommentPages>({ queryKey }, (data) =>
        patchLike(data, commentId, liked),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.show({ message: failureMessage(error, '도움돼요를 남기지 못했어요'), tone: 'error' });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
