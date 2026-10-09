import type { ConcernCommentResponse } from '@ogonggo/api';
import { getAuthorName } from '@/entities/concern/model/author';
import { RelativeTime } from '@/entities/concern/ui/RelativeTime';
import { CommentIcon } from '@/shared/ui/icons';
import { DELETED_COMMENT_CONTENT } from '../api/concernCommentsApi';
import { AuthorAvatar } from './AuthorAvatar';
import { ConcernAuthorBadge, ManagerBadge } from './CommentBadges';

export interface ConcernCommentItemProps {
  /** 답변(`ConcernCommentRootResponse`) 도 이 모양에 들어간다 — 답글 쪽에만 있는 `parentId` 는 선택 값이다. */
  comment: ConcernCommentResponse;
  /** 답변에만 준다. 답글 수를 보이고, 답글에는 다시 답글을 달 수 없어(백엔드 400) 답글은 주지 않는다. */
  replyCount?: number;
}

/**
 * 답변·답글 한 건 — 시안의 `프로필 · 닉네임 · 배지 … N시간 전` 줄, 본문, `도움돼요 N` 과 답글 수 줄.
 * 시각의 자리가 화면 폭에 따라 다르다(`상세.webp`, `모바일 상세.webp`). 데스크톱은 윗줄 오른쪽 끝이고
 * 모바일은 아랫줄 오른쪽 끝이다. 같은 노드를 두 자리에 두고 화면 폭으로 가린다.
 *
 * 시안의 `신고` 는 그리지 않는다 — 취준고민 답변 신고 API 가 없다(PRD).
 *
 * 삭제된 답변은 작성자와 숫자를 모두 감추고 흐린 문구만 남긴다. 답글이 남아 있어 자리는 지켜야 하지만
 * 지운 사람의 이름을 그 자리에 둘 이유는 없다.
 */
export function ConcernCommentItem({ comment, replyCount }: ConcernCommentItemProps) {
  if (comment.deleted) {
    return <p className="py-1 text-sm text-gray-400">{DELETED_COMMENT_CONTENT}</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <AuthorAvatar src={comment.author.profileImageUrl} />
        <span className="min-w-0 truncate text-sm font-bold text-gray-900">
          {getAuthorName(comment.author)}
        </span>
        {comment.official ? <ManagerBadge /> : null}
        {comment.concernAuthor ? <ConcernAuthorBadge /> : null}
        <RelativeTime
          value={comment.createdAt}
          className="ml-auto hidden shrink-0 text-xs text-gray-400 md:block"
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-line text-gray-800">
        {comment.content}
      </p>
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
        <span>도움돼요 {comment.likeCount}</span>
        {replyCount !== undefined ? (
          <span className="flex items-center gap-1">
            <CommentIcon className="h-3.5 w-3.5" />
            <span className="sr-only">답글</span>
            {replyCount}
          </span>
        ) : null}
        <RelativeTime value={comment.createdAt} className="ml-auto shrink-0 md:hidden" />
      </div>
    </div>
  );
}
