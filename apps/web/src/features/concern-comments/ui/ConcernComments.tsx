'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ConcernCommentResponse } from '@ogonggo/api';
import { ConfirmDelete, cn } from '@ogonggo/ui';
import { useSignedIn } from '@/shared/api/useSignedIn';
import { sanitizeReturnPath } from '@/shared/lib/returnPath';
import {
  failureMessage,
  useCommentActions,
  useCommentCount,
} from '../model/useConcernCommentActions';
import { useRootComments } from '../model/useConcernComments';
import { ConcernCommentComposer } from './ConcernCommentComposer';
import { ConcernCommentThread } from './ConcernCommentThread';

export interface ConcernCommentsProps {
  concernId: number;
  /** 서버 렌더가 받은 `commentCount`(남아 있는 답변 수, 답글은 세지 않는다). 제목 옆 숫자가 여기서 시작한다. */
  commentCount: number;
}

/** 확인 창에 보일 답변 앞부분 길이. 긴 글을 통째로 넣으면 확인 창이 본문이 된다. */
const TARGET_PREVIEW_LENGTH = 20;

/**
 * 고민글 상세의 답변 영역 — 시안의 `답변 N` 제목, 답변 카드 목록, 답변 작성 카드. 답변은 먼저 쓴 순이다
 * (백엔드 정렬) 라 새 답변은 목록 끝에 붙고, 작성 카드도 목록 아래에 있다.
 *
 * 읽기는 로그인 없이 된다. 로그인하지 않았으면 작성 카드는 같은 크기로 잠기고 등록 버튼 자리가
 * `로그인하고 답변하기` 링크가 된다. 로그인 여부는 마운트 뒤에야 알 수 있어(`useSignedIn`) 첫 화면은 잠긴
 * 상태로 그렸다가 바뀐다.
 *
 * 삭제 확인은 저장소의 삭제 확인(`ConfirmDelete`) 을 그대로 쓴다. 영역에 한 벌만 두고 어느 것인지를 상태로
 * 넘긴다.
 */
export function ConcernComments({ concernId, commentCount }: ConcernCommentsProps) {
  const signedIn = useSignedIn();
  const signInHref = useSignInHref();
  const count = useCommentCount(concernId, commentCount);
  const roots = useRootComments(concernId);
  const { create, remove } = useCommentActions(concernId, commentCount);
  const { hasNextPage, isFetching, isError, fetchNextPage } = roots;

  const [deleting, setDeleting] = useState<{
    comment: ConcernCommentResponse;
    isRoot: boolean;
    hasReplies: boolean;
  } | null>(null);
  // 답변을 쓴 뒤 끝까지 이어 읽는다. 새 답변은 목록 끝에 붙어서, 다음 페이지가 남아 있으면 방금 쓴 글이
  // `답변 더보기` 뒤에 숨는다. 읽기가 실패하면 멈춘다 — 실패해도 `hasNextPage` 는 그대로라 멈추지 않으면 같은
  // 요청을 끝없이 다시 보낸다. 사용자가 `다시 시도` 하면 이어서 읽는다.
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (showAll && hasNextPage && !isFetching && !isError) {
      void fetchNextPage();
    }
  }, [showAll, hasNextPage, isFetching, isError, fetchNextPage]);

  const items = roots.data?.pages.flatMap((page) => page.items) ?? [];
  // 다음 페이지 첫 줄이 앞 페이지 끝 줄과 겹치는 경우를 위해 id 로 한 번 거른다.
  const uniqueItems = items.filter(
    (item, index) => items.findIndex((other) => other.id === item.id) === index,
  );
  // 이미 읽은 목록이 있는데 다음 쪽이나 다시 읽기가 실패한 경우. 목록은 그대로 두고 그 아래에 알린다.
  const loadFailed = isError && roots.data !== undefined;
  const retry = () => void (roots.isFetchNextPageError ? fetchNextPage() : roots.refetch());

  return (
    <section aria-labelledby="concern-comments-title">
      <h2 id="concern-comments-title" className="text-lg font-bold text-gray-900">
        답변 <span className="text-blue-500">{count}</span>
      </h2>

      <div className="mt-4 flex flex-col gap-4">
        {roots.isPending ? (
          <p className="py-8 text-center text-sm text-gray-400">답변을 불러오는 중입니다.</p>
        ) : isError && roots.data === undefined ? (
          <LoadError className="py-8" onRetry={() => void roots.refetch()} />
        ) : uniqueItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            아직 답변이 없어요. 첫 답변을 남겨보세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {uniqueItems.map((root) => (
              <ConcernCommentThread
                key={root.id}
                concernId={concernId}
                root={root}
                signInHref={signedIn ? null : signInHref}
                replyPending={create.isPending}
                onCreateReply={(parentId, content) => create.mutateAsync({ content, parentId })}
                onDelete={(comment, isRoot, hasReplies) => {
                  remove.reset();
                  setDeleting({ comment, isRoot, hasReplies });
                }}
              />
            ))}
          </ul>
        )}

        {loadFailed ? (
          <LoadError className="py-2" onRetry={retry} />
        ) : hasNextPage ? (
          <button
            type="button"
            disabled={roots.isFetchingNextPage}
            onClick={() => void fetchNextPage()}
            className="w-full rounded-md border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:text-gray-300"
          >
            {roots.isFetchingNextPage ? '불러오는 중' : '답변 더보기'}
          </button>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-7">
          <ConcernCommentComposer
            placeholder="내 경험을 나눠주세요. 따뜻한 한마디도 큰 힘이 돼요!"
            submitLabel="답변 등록하기"
            pending={create.isPending}
            signInHref={signedIn ? null : signInHref}
            onSubmit={(content) => create.mutateAsync({ content }).then(() => setShowAll(true))}
          />
        </div>
      </div>

      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting ? preview(deleting.comment.content) : ''}
        description={
          deleting?.hasReplies
            ? '달린 답글은 그대로 남고, 이 답변 자리에는 "삭제된 댓글입니다" 가 표시됩니다.'
            : undefined
        }
        isDeleting={remove.isPending}
        errorMessage={
          remove.isError ? failureMessage(remove.error, '삭제하지 못했어요') : undefined
        }
        onConfirm={() => {
          if (deleting && !remove.isPending) {
            remove.mutate(
              { commentId: deleting.comment.id, isRoot: deleting.isRoot },
              { onSuccess: () => setDeleting(null) },
            );
          }
        }}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
}

/** 답변을 읽지 못했을 때의 안내와 `다시 시도`. 문구와 모양은 사이드·스터디 댓글 영역(`댓글을 불러오지 못했습니다`) 의 관례를 따른다. */
function LoadError({ className, onRetry }: { className: string; onRetry: () => void }) {
  return (
    <div className={cn('text-center text-sm text-gray-500', className)}>
      <p>답변을 불러오지 못했습니다.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 font-semibold text-blue-600 hover:underline"
      >
        다시 시도
      </button>
    </div>
  );
}

function preview(content: string): string {
  return content.length > TARGET_PREVIEW_LENGTH
    ? `${content.slice(0, TARGET_PREVIEW_LENGTH)}…`
    : content;
}

/**
 * 로그인 뒤 이 글로 돌아오는 로그인 주소. 돌아갈 곳은 `?redirect=` 를 받는 쪽과 같은 규칙으로 거른다
 * (`shared/lib/returnPath.ts`) — 사이드·스터디 댓글(`features/recruitment-post-comments`) 과 같은
 * 모양이고, 기능끼리 임포트하지 않으므로(`features/README.md`) 따로 둔다.
 *
 * 상세 주소에는 쿼리가 없어 경로만 쓴다. `useSearchParams` 를 부르면 이 영역이 든 화면 전체가
 * 클라이언트 렌더로 내려간다.
 */
function useSignInHref(): string {
  const current = sanitizeReturnPath(usePathname());
  return current ? `/login?redirect=${encodeURIComponent(current)}` : '/login';
}
