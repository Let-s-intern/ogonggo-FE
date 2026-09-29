'use client';

import Link from 'next/link';
import type { RecruitmentPostCommentResponse } from '@ogonggo/api';
import { AUTHOR_NICKNAME_FALLBACK } from '@/entities/side-study/model/labels';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { DELETED_COMMENT_CONTENT } from '../api/commentsApi';
import { formatRelativeTime } from '../lib/relativeTime';

export interface CommentItemProps {
  comment: RecruitmentPostCommentResponse;
  /** 삭제된 부모 댓글. `isDeletedRootComment` 로 가린 값을 부모 쪽에서 넘긴다. */
  deleted?: boolean;
  /** 모집글 작성자. 같은 사람이 쓴 댓글에 `작성자` 배지를 붙인다. */
  postAuthorId: number;
  /** 로그인하지 않았으면 답글·신고 대신 이 주소(로그인 화면) 로 보낸다. */
  signInHref: string | null;
  /** 부모 댓글에만 준다. 대댓글에는 다시 답글을 달 수 없다(백엔드 400). */
  onReply?: () => void;
  onDelete: () => void;
  onReport: () => void;
}

/**
 * 삭제된 부모 댓글인지. 응답에 삭제 여부 필드가 없어 백엔드가 넣어 주는 문구로 가린다
 * (`api/commentsApi.ts` 의 `DELETED_COMMENT_CONTENT`). 부모 댓글에만 쓴다 — 삭제된 대댓글은
 * 응답에 오지 않으므로, 대댓글이 같은 문장이면 그것은 누군가 그렇게 쓴 글이다.
 */
export function isDeletedRootComment(comment: RecruitmentPostCommentResponse): boolean {
  return comment.content === DELETED_COMMENT_CONTENT;
}

/**
 * 댓글 한 줄 — 목업의 `프로필 · 닉네임 · 작성자 배지 … N시간 전 | 신고` 와 본문.
 *
 * 삭제된 부모 댓글은 작성자와 동작을 모두 감추고 회색 문구만 남긴다. 대댓글이 남아 있어 자리는
 * 지켜야 하지만(LC-3309), 지운 사람의 이름을 그 자리에 남길 이유는 없다. 백엔드도 그 댓글에는
 * 답글·신고·삭제를 404 로 막는다.
 */
export function CommentItem({
  comment,
  deleted = false,
  postAuthorId,
  signInHref,
  onReply,
  onDelete,
  onReport,
}: CommentItemProps) {
  if (deleted) {
    return <p className="py-1 text-sm text-gray-400">{DELETED_COMMENT_CONTENT}</p>;
  }

  const actionClass = 'text-xs text-gray-400 hover:text-gray-700';
  const actions: { label: string; onClick: () => void }[] = [];
  if (onReply) {
    actions.push({ label: '답글', onClick: onReply });
  }
  actions.push(
    comment.mine ? { label: '삭제', onClick: onDelete } : { label: '신고', onClick: onReport },
  );

  return (
    <div>
      <div className="flex items-center gap-2">
        <Thumbnail
          src={comment.author.profileImageUrl}
          alt=""
          className="h-6 w-6 shrink-0 overflow-hidden rounded-sm"
        />
        <span className="min-w-0 truncate text-sm font-bold text-gray-900">
          {comment.author.nickname ?? AUTHOR_NICKNAME_FALLBACK}
        </span>
        {comment.author.userId === postAuthorId ? (
          <span className="shrink-0 rounded-sm bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-600">
            작성자
          </span>
        ) : null}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-gray-400">
          <time dateTime={comment.createdAt}>{formatRelativeTime(comment.createdAt)}</time>
          {actions.map((action) => (
            <span key={action.label} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-px bg-gray-300" />
              {/* 삭제는 내 댓글에만 보이므로 로그인한 상태다. 답글·신고는 로그인이 필요해
                  로그인하지 않았으면 로그인 화면으로 보낸다(돌아올 곳을 붙여서). */}
              {signInHref && action.label !== '삭제' ? (
                <Link href={signInHref} className={actionClass}>
                  {action.label}
                </Link>
              ) : (
                <button type="button" onClick={action.onClick} className={actionClass}>
                  {action.label}
                </button>
              )}
            </span>
          ))}
        </span>
      </div>
      <p className="mt-2 text-sm break-words whitespace-pre-line text-gray-800">
        {comment.content}
      </p>
    </div>
  );
}
