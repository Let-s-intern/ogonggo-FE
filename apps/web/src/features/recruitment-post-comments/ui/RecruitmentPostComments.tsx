'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { RecruitmentPostCommentResponse } from '@ogonggo/api';
import { ConfirmDelete } from '@ogonggo/ui';
import { useSignedIn } from '@/shared/api/useSignedIn';
import { sanitizeReturnPath } from '@/shared/lib/returnPath';
import {
  failureMessage,
  useCommentActions,
  useCommentCount,
  useRootComments,
} from '../model/useComments';
import { CommentComposer } from './CommentComposer';
import { CommentThread } from './CommentThread';
import { ReportCommentModal } from './ReportCommentModal';

export interface RecruitmentPostCommentsProps {
  postId: number;
  /** 모집글 작성자(`author.userId`). 그 사람의 댓글에 `작성자` 배지가 붙는다. */
  postAuthorId: number;
  /** 서버 렌더가 받은 `commentCount`. 제목 옆 개수가 여기서 시작한다. */
  commentCount: number;
}

/** 확인 창에 보일 댓글 앞부분 길이. 긴 댓글을 통째로 넣으면 확인 창이 본문이 된다. */
const TARGET_PREVIEW_LENGTH = 20;

/**
 * 사이드·스터디 상세의 댓글 영역 — 목업(`사이드스터디 상세페이지.png`) 사이드바의 `댓글 N`,
 * 입력칸, 회색 카드 목록 그대로다. 부모 댓글은 최신순, 대댓글은 오래된 순이다(백엔드 정렬).
 *
 * 로그인하지 않았으면 입력칸 자리에 로그인 안내를 둔다. 목록은 누구나 본다 — 백엔드가 비로그인
 * 조회를 받는다. 로그인 여부는 마운트 뒤에야 알 수 있어(`useSignedIn`) 첫 화면은 안내로
 * 그렸다가 입력칸으로 바뀐다.
 *
 * 삭제 확인은 저장소의 삭제 확인(`ConfirmDelete`) 을 그대로 쓴다. 신고는 사유를 받는 작은 창이다.
 * 둘 다 영역에 한 벌만 두고 어느 댓글인지를 상태로 넘긴다.
 */
export function RecruitmentPostComments({
  postId,
  postAuthorId,
  commentCount,
}: RecruitmentPostCommentsProps) {
  const signedIn = useSignedIn();
  const signInHref = useSignInHref();
  const count = useCommentCount(postId, commentCount);
  const roots = useRootComments(postId);
  const { create, remove, report } = useCommentActions(postId);

  const [deleting, setDeleting] = useState<{
    comment: RecruitmentPostCommentResponse;
    hasReplies: boolean;
  } | null>(null);
  const [reporting, setReporting] = useState<RecruitmentPostCommentResponse | null>(null);

  const items = roots.data?.pages.flatMap((page) => page.items) ?? [];
  // 새 댓글이 앞에 끼면 다음 페이지 첫 줄이 앞 페이지 끝 줄과 겹친다. 작성 뒤 전부 다시 읽지만
  // 그 사이에 `더보기` 를 누르는 경우를 위해 id 로 한 번 거른다.
  const uniqueItems = items.filter(
    (item, index) => items.findIndex((other) => other.id === item.id) === index,
  );

  return (
    <section aria-labelledby="recruitment-post-comments-title">
      <h2 id="recruitment-post-comments-title" className="text-base font-bold text-gray-900">
        댓글 <span className="text-blue-600">{count}</span>
      </h2>

      <div className="mt-3">
        {signedIn ? (
          <CommentComposer
            placeholder="응원과 질문을 남겨보세요"
            submitLabel="등록"
            pending={create.isPending}
            onSubmit={(content) => create.mutateAsync({ content })}
          />
        ) : (
          <p className="rounded-md border border-gray-200 px-3 py-3 text-sm text-gray-500">
            댓글을 쓰려면{' '}
            <Link href={signInHref} className="font-semibold text-blue-600 hover:underline">
              로그인
            </Link>
            이 필요해요.
          </p>
        )}
      </div>

      <div className="mt-4">
        {roots.isPending ? (
          <p className="py-4 text-center text-sm text-gray-400">댓글을 불러오는 중입니다.</p>
        ) : roots.isError ? (
          <div className="py-4 text-center text-sm text-gray-500">
            <p>댓글을 불러오지 못했습니다.</p>
            <button
              type="button"
              onClick={() => void roots.refetch()}
              className="mt-1 font-semibold text-blue-600 hover:underline"
            >
              다시 시도
            </button>
          </div>
        ) : uniqueItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">첫 댓글을 남겨보세요.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {uniqueItems.map((root) => (
              <CommentThread
                key={root.id}
                postId={postId}
                root={root}
                postAuthorId={postAuthorId}
                signInHref={signedIn ? null : signInHref}
                replyPending={create.isPending}
                onCreateReply={(parentId, content) => create.mutateAsync({ content, parentId })}
                onDelete={(comment, hasReplies) => {
                  remove.reset();
                  setDeleting({ comment, hasReplies });
                }}
                onReport={(comment) => {
                  report.reset();
                  setReporting(comment);
                }}
              />
            ))}
          </ul>
        )}

        {roots.hasNextPage ? (
          <button
            type="button"
            disabled={roots.isFetchingNextPage}
            onClick={() => void roots.fetchNextPage()}
            className="mt-3 w-full rounded-md border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:text-gray-300"
          >
            {roots.isFetchingNextPage ? '불러오는 중' : '댓글 더보기'}
          </button>
        ) : null}
      </div>

      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting ? preview(deleting.comment.content) : ''}
        description={
          deleting?.hasReplies
            ? '달린 답글은 그대로 남고, 이 댓글 자리에는 "삭제된 댓글입니다" 가 표시됩니다.'
            : undefined
        }
        isDeleting={remove.isPending}
        errorMessage={
          remove.isError ? failureMessage(remove.error, '댓글을 삭제하지 못했어요') : undefined
        }
        onConfirm={() => {
          if (deleting && !remove.isPending) {
            remove.mutate(deleting.comment.id, { onSuccess: () => setDeleting(null) });
          }
        }}
        onClose={() => setDeleting(null)}
      />

      <ReportCommentModal
        open={reporting !== null}
        pending={report.isPending}
        errorMessage={
          report.isError ? failureMessage(report.error, '신고하지 못했어요') : undefined
        }
        onSubmit={(reason) => {
          if (reporting && !report.isPending) {
            report.mutate(
              { commentId: reporting.id, reason },
              { onSuccess: () => setReporting(null) },
            );
          }
        }}
        onClose={() => setReporting(null)}
      />
    </section>
  );
}

function preview(content: string): string {
  return content.length > TARGET_PREVIEW_LENGTH
    ? `${content.slice(0, TARGET_PREVIEW_LENGTH)}…`
    : content;
}

/**
 * 로그인 뒤 이 글로 돌아오는 로그인 주소. 돌아갈 곳은 `?redirect=` 를 받는 쪽과 같은 규칙으로
 * 거른다(`shared/lib/returnPath.ts`) — `features/bookmark` 의 `signInHref` 와 같은 모양이고,
 * 기능끼리 임포트하지 않으므로(`features/README.md`) 따로 둔다.
 *
 * 상세 주소에는 쿼리가 없어 경로만 쓴다. `useSearchParams` 를 부르면 이 영역이 든 화면 전체가
 * 클라이언트 렌더로 내려간다.
 */
function useSignInHref(): string {
  const current = sanitizeReturnPath(usePathname());
  return current ? `/login?redirect=${encodeURIComponent(current)}` : '/login';
}
