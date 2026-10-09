'use client';

import { useState } from 'react';
import type { ConcernCommentRootResponse } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { useMoreReplies } from '../model/useConcernComments';
import { ConcernCommentItem } from './ConcernCommentItem';

export interface ConcernCommentThreadProps {
  concernId: number;
  root: ConcernCommentRootResponse;
}

/**
 * 답변 하나와 그 답글 — 시안의 둥근 카드 한 장. 운영자 답변(`official`) 은 연한 파랑 바탕이다. 답글은 카드
 * 안에서 왼쪽 가는 선과 함께 들여 쓴다.
 *
 * 답글은 답변 조회가 붙여 준 앞쪽 5 건을 먼저 그리고, 더 있으면 `답글 N개 더보기` 로 이어 읽는다
 * (`useMoreReplies`). 같은 답글이 앞쪽 5 건과 다음 페이지에 겹쳐 오는 경우(그사이 답글이 지워져 페이지가
 * 밀린 경우) 를 위해 id 로 한 번 거른다.
 */
export function ConcernCommentThread({ concernId, root }: ConcernCommentThreadProps) {
  const [expanded, setExpanded] = useState(false);
  const more = useMoreReplies(concernId, root.id, expanded);

  const replies = uniqueById([
    ...root.replies.items,
    ...(more.data?.pages.flatMap((page) => page.items) ?? []),
  ]);
  const remaining = root.replies.pageInfo.totalElements - replies.length;

  return (
    <li
      className={cn(
        'rounded-xl border p-5 md:p-7',
        root.official && !root.deleted ? 'border-blue-100 bg-blue-00' : 'border-gray-200 bg-white',
      )}
    >
      <ConcernCommentItem comment={root} replyCount={root.replies.pageInfo.totalElements} />

      {replies.length > 0 ? (
        <div className="mt-4 flex flex-col gap-4 border-l-2 border-gray-200 pl-4 md:pl-5">
          <ul className="flex flex-col gap-4">
            {replies.map((reply) => (
              <li key={reply.id}>
                <ConcernCommentItem comment={reply} />
              </li>
            ))}
          </ul>

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
