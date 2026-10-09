'use client';

import { useEffect, useState } from 'react';
import type { ConcernCommentResponse, ConcernCommentRootResponse } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { REPLY_PAGE_SIZE } from '../api/concernCommentsApi';
import { useMoreReplies } from '../model/useConcernComments';
import { ConcernCommentComposer } from './ConcernCommentComposer';
import { ConcernCommentItem } from './ConcernCommentItem';

export interface ConcernCommentThreadProps {
  concernId: number;
  root: ConcernCommentRootResponse;
  /** 로그인하지 않았으면 로그인 화면 주소. 답글 자리가 그리로 간다. */
  signInHref: string | null;
  replyPending: boolean;
  onCreateReply: (parentId: number, content: string) => Promise<unknown>;
  /** `hasReplies` 는 삭제 확인에서 "답글은 남는다" 를 알릴지 가른다. */
  onDelete: (comment: ConcernCommentResponse, isRoot: boolean, hasReplies: boolean) => void;
}

/**
 * 답변 하나와 그 답글 — 시안의 둥근 카드 한 장. 운영자 답변(`official`) 은 연한 파랑 바탕이다. 답글은 카드
 * 안에서 왼쪽 가는 선과 함께 들여 쓴다.
 *
 * 답글은 답변 조회가 붙여 준 앞쪽 5 건을 먼저 그리고, 더 있으면 `답글 N개 더보기` 로 이어 읽는다
 * (`useMoreReplies`). 같은 답글이 앞쪽 5 건과 다음 페이지에 겹쳐 오는 경우(그사이 답글이 지워져 페이지가
 * 밀린 경우) 를 위해 id 로 한 번 거른다.
 *
 * 답글은 오래된 순이라 새 답글은 끝에 붙는다. 앞쪽 5 건이 이미 찬 답변에 답글을 달면 방금 쓴 글이
 * `더보기` 뒤에 숨으므로, 그때는 끝까지 이어 읽어 보여 준다(`showAll`).
 *
 * 답글에는 답글 버튼이 없다 — 답글에 다시 답글은 달 수 없다(백엔드 400). 삭제된 답변에도 답글을 달 수
 * 없어(백엔드 404) 그 답변에는 답글 버튼이 없다(`ConcernCommentItem`).
 */
export function ConcernCommentThread({
  concernId,
  root,
  signInHref,
  replyPending,
  onCreateReply,
  onDelete,
}: ConcernCommentThreadProps) {
  const [replying, setReplying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const more = useMoreReplies(concernId, root.id, expanded);
  const { hasNextPage, isFetching, fetchNextPage } = more;

  useEffect(() => {
    if (showAll && hasNextPage && !isFetching) {
      void fetchNextPage();
    }
  }, [showAll, hasNextPage, isFetching, fetchNextPage]);

  const replies = uniqueById([
    ...root.replies.items,
    ...(more.data?.pages.flatMap((page) => page.items) ?? []),
  ]);
  const totalReplies = root.replies.pageInfo.totalElements;
  const remaining = totalReplies - replies.length;

  const submitReply = (content: string) => {
    const overflowing = totalReplies >= REPLY_PAGE_SIZE;
    return onCreateReply(root.id, content).then(() => {
      setReplying(false);
      if (overflowing) {
        setExpanded(true);
        setShowAll(true);
      }
    });
  };

  return (
    <li
      className={cn(
        'rounded-xl border p-5 md:p-7',
        root.official && !root.deleted ? 'border-blue-100 bg-blue-00' : 'border-gray-200 bg-white',
      )}
    >
      <ConcernCommentItem
        concernId={concernId}
        comment={root}
        replyCount={totalReplies}
        signInHref={signInHref}
        onReply={() => setReplying((open) => !open)}
        onDelete={() => onDelete(root, true, totalReplies > 0)}
      />

      {replies.length > 0 || (replying && !root.deleted) ? (
        <div className="mt-4 flex flex-col gap-4 border-l-2 border-gray-200 pl-4 md:pl-5">
          {replies.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {replies.map((reply) => (
                <li key={reply.id}>
                  <ConcernCommentItem
                    concernId={concernId}
                    comment={reply}
                    signInHref={signInHref}
                    onDelete={() => onDelete(reply, false, false)}
                  />
                </li>
              ))}
            </ul>
          ) : null}

          {remaining > 0 ? (
            <button
              type="button"
              disabled={isFetching}
              onClick={() => (expanded ? void fetchNextPage() : setExpanded(true))}
              className="self-start text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:text-gray-300"
            >
              {isFetching ? '불러오는 중' : `답글 ${remaining}개 더보기`}
            </button>
          ) : null}

          {replying && !root.deleted ? (
            <ConcernCommentComposer
              placeholder="답글을 남겨보세요"
              submitLabel="답글 등록"
              pending={replyPending}
              rows={2}
              autoFocus
              onCancel={() => setReplying(false)}
              onSubmit={submitReply}
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
