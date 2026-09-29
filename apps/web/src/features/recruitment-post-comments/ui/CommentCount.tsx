'use client';

import { CommentIcon } from '@/shared/ui/icons';
import { useCommentCount } from '../model/useComments';

export interface CommentCountProps {
  postId: number;
  /** 서버 렌더가 받은 `commentCount`. */
  commentCount: number;
}

/**
 * 상세 헤더 카드의 댓글 수(목업의 `댓글 · 조회수` 중 앞쪽). 댓글 영역에서 쓰고 지우면 같이
 * 바뀐다(`useCommentCount`). 아이콘과 크기는 목록 카드의 댓글 수와 같다.
 */
export function CommentCount({ postId, commentCount }: CommentCountProps) {
  const count = useCommentCount(postId, commentCount);
  return (
    <span className="flex items-center gap-1">
      <CommentIcon className="h-4 w-4" />
      <span className="sr-only">댓글</span>
      {count}
    </span>
  );
}
