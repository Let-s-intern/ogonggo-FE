'use client';

import { useState } from 'react';
import type {
  RecruitmentPostCommentResponse,
  RecruitmentPostCommentRootResponse,
} from '@ogonggo/api';
import { useMoreReplies } from '../model/useComments';
import { CommentComposer } from './CommentComposer';
import { CommentItem, isDeletedRootComment } from './CommentItem';

export interface CommentThreadProps {
  postId: number;
  root: RecruitmentPostCommentRootResponse;
  postAuthorId: number;
  signInHref: string | null;
  replyPending: boolean;
  onCreateReply: (parentId: number, content: string) => Promise<unknown>;
  /** `hasReplies` 는 삭제 확인에서 "대댓글은 남는다" 를 알릴지 가른다. */
  onDelete: (comment: RecruitmentPostCommentResponse, hasReplies: boolean) => void;
  onReport: (comment: RecruitmentPostCommentResponse) => void;
}

/**
 * 부모 댓글 하나와 그 대댓글 — 목업의 회색 카드 한 장. 대댓글은 들여 써서 같은 카드 안에 둔다.
 *
 * 대댓글은 부모 조회가 붙여 준 미리보기 5 건을 먼저 그리고, 더 있으면 `답글 N개 더보기` 로
 * 이어 읽는다(`useMoreReplies`). 같은 대댓글이 미리보기와 다음 페이지에 겹쳐 오는 경우(그사이
 * 대댓글이 지워져 페이지가 밀린 경우) 를 위해 id 로 한 번 거른다.
 */
export function CommentThread({
  postId,
  root,
  postAuthorId,
  signInHref,
  replyPending,
  onCreateReply,
  onDelete,
  onReport,
}: CommentThreadProps) {
  const [replying, setReplying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const more = useMoreReplies(postId, root.id, expanded);

  const replies = uniqueById([
    ...root.replies.items,
    ...(more.data?.pages.flatMap((page) => page.items) ?? []),
  ]);
  const remaining = root.replies.pageInfo.totalElements - replies.length;
  const deleted = isDeletedRootComment(root);

  return (
    <li className="rounded-md bg-gray-50 p-3">
      <CommentItem
        comment={root}
        deleted={deleted}
        postAuthorId={postAuthorId}
        signInHref={signInHref}
        onReply={() => setReplying(true)}
        onDelete={() => onDelete(root, root.replies.pageInfo.totalElements > 0)}
        onReport={() => onReport(root)}
      />

      {replies.length > 0 || replying ? (
        <div className="mt-3 flex flex-col gap-3 border-t border-gray-200 pt-3 pl-5">
          {replies.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {replies.map((reply) => (
                <li key={reply.id}>
                  <CommentItem
                    comment={reply}
                    postAuthorId={postAuthorId}
                    signInHref={signInHref}
                    onDelete={() => onDelete(reply, false)}
                    onReport={() => onReport(reply)}
                  />
                </li>
              ))}
            </ul>
          ) : null}

          {remaining > 0 ? (
            <button
              type="button"
              disabled={more.isFetching}
              onClick={() => (expanded ? void more.fetchNextPage() : setExpanded(true))}
              className="self-start text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:text-gray-300"
            >
              {more.isFetching ? '불러오는 중' : `답글 ${remaining}개 더보기`}
            </button>
          ) : null}

          {/* 삭제된 부모에는 답글을 달 수 없다(백엔드 404). 그 댓글엔 `답글` 버튼도 없다. */}
          {replying && !deleted ? (
            <CommentComposer
              placeholder="답글을 남겨보세요"
              submitLabel="답글 등록"
              pending={replyPending}
              autoFocus
              onCancel={() => setReplying(false)}
              onSubmit={(content) => onCreateReply(root.id, content).then(() => setReplying(false))}
            />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function uniqueById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}
