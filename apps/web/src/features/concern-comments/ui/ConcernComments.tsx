'use client';

import { useRootComments } from '../model/useConcernComments';
import { ConcernCommentThread } from './ConcernCommentThread';

export interface ConcernCommentsProps {
  concernId: number;
  /** 서버 렌더가 받은 `commentCount`(남아 있는 답변 수, 답글은 세지 않는다). 제목 옆 숫자다. */
  commentCount: number;
}

/**
 * 고민글 상세의 답변 영역 — 시안의 `답변 N` 제목과 답변 카드 목록. 답변은 먼저 쓴 순이다(백엔드 정렬).
 * 읽기는 로그인 없이 된다. 다음 페이지는 `답변 더보기` 로 이어 붙인다.
 */
export function ConcernComments({ concernId, commentCount }: ConcernCommentsProps) {
  const roots = useRootComments(concernId);

  const items = roots.data?.pages.flatMap((page) => page.items) ?? [];
  // 다음 페이지 첫 줄이 앞 페이지 끝 줄과 겹치는 경우를 위해 id 로 한 번 거른다.
  const uniqueItems = items.filter(
    (item, index) => items.findIndex((other) => other.id === item.id) === index,
  );

  return (
    <section aria-labelledby="concern-comments-title">
      <h2 id="concern-comments-title" className="text-lg font-bold text-gray-900">
        답변 <span className="text-blue-500">{commentCount}</span>
      </h2>

      <div className="mt-4">
        {roots.isPending ? (
          <p className="py-8 text-center text-sm text-gray-400">답변을 불러오는 중입니다.</p>
        ) : roots.isError ? (
          <div className="py-8 text-center text-sm text-gray-500">
            <p>답변을 불러오지 못했습니다.</p>
            <button
              type="button"
              onClick={() => void roots.refetch()}
              className="mt-1 font-semibold text-blue-600 hover:underline"
            >
              다시 시도
            </button>
          </div>
        ) : uniqueItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">아직 답변이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {uniqueItems.map((root) => (
              <ConcernCommentThread key={root.id} concernId={concernId} root={root} />
            ))}
          </ul>
        )}

        {roots.hasNextPage ? (
          <button
            type="button"
            disabled={roots.isFetchingNextPage}
            onClick={() => void roots.fetchNextPage()}
            className="mt-4 w-full rounded-md border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:text-gray-300"
          >
            {roots.isFetchingNextPage ? '불러오는 중' : '답변 더보기'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
