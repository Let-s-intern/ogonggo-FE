'use client';

import Link from 'next/link';
import type { ConcernCommentResponse } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { useCommentLike } from '../model/useCommentLike';

export interface CommentLikeButtonProps {
  concernId: number;
  comment: ConcernCommentResponse;
  /** 로그인하지 않았으면 로그인 화면 주소. 누르면 그리로 보낸다(돌아올 곳을 붙여서). */
  signInHref: string | null;
}

/**
 * `도움돼요 N` — 시안은 글자만 그린다. 눌러서 켜고 끄며, 내가 눌렀으면(`liked`) 파란 글자로 보인다.
 * 요청이 진행 중인 동안은 다시 누를 수 없다.
 */
export function CommentLikeButton({ concernId, comment, signInHref }: CommentLikeButtonProps) {
  const like = useCommentLike(concernId);
  const className = cn(
    'text-xs hover:text-gray-700',
    comment.liked ? 'font-semibold text-blue-500 hover:text-blue-600' : 'text-gray-400',
  );
  const label = `도움돼요 ${comment.likeCount}`;

  if (signInHref) {
    return (
      <Link href={signInHref} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={comment.liked}
      disabled={like.isPending}
      onClick={() => like.mutate({ commentId: comment.id, liked: !comment.liked })}
      className={className}
    >
      {label}
    </button>
  );
}
