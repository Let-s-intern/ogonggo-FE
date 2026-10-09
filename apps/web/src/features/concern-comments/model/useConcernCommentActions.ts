'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '@ogonggo/api';
import { useToast } from '@ogonggo/ui';
import { concernCommentsKey, createComment, deleteComment } from '../api/concernCommentsApi';

/**
 * 헤더 카드와 답변 영역 제목이 함께 보는 답변 수의 캐시 키. 서버가 읽은 값(`initialCount`) 을 키에
 * 넣는다 — 같은 탭에서 이 글을 다시 열었을 때 서버가 새로 준 값이 앞서 이 화면이 가감한 값에 가려지지
 * 않는다.
 */
function commentCountKey(concernId: number, initialCount: number) {
  return ['concern-comment-count', concernId, initialCount] as const;
}

/**
 * 고민글의 답변 수(`commentCount`). 서버 렌더가 준 값에서 시작해 이 화면에서 쓰고 지운 만큼 ±1 한다.
 * 헤더 카드의 숫자와 답변 영역 제목의 숫자가 서로 다른 컴포넌트라, 둘이 같은 값을 보도록 쿼리 캐시 한
 * 칸을 저장소로 쓴다. 요청은 보내지 않는다(`queryFn` 은 받은 값을 돌려줄 뿐).
 *
 * 백엔드 규칙은 이렇다. 답변을 쓰면 1 늘고 지우면 1 준다. **답글은 세지 않는다** — 쓰거나 지워도 그대로다.
 * 답변을 지워도 남은 답글은 그대로 보이고 숫자는 답글만큼 더 줄지 않는다.
 */
export function useCommentCount(concernId: number, initialCount: number): number {
  const { data } = useQuery({
    queryKey: commentCountKey(concernId, initialCount),
    queryFn: () => initialCount,
    initialData: initialCount,
    staleTime: Infinity,
  });
  return data;
}

/**
 * 작성·삭제. 둘 다 응답에 새 목록이 없어(`id` 하나 또는 빈 본문) 성공하면 이 글의 답변 캐시를 통째로
 * 무효화해 다시 읽는다. 먼저 바꿔 그리지 않는다 — 새 답변의 작성자 닉네임·프로필과 목록 속 위치를 화면이
 * 지어낼 수 없다. 무효화가 끝날 때까지 `mutateAsync` 가 끝나지 않으므로 부르는 쪽은 끝난 뒤의 목록을 본다.
 *
 * 401 은 `shared/api/reissue.ts` 의 재발급 흐름이 먼저 받는다. 재발급까지 실패하면 그 흐름이 로그인
 * 화면으로 보낸다.
 */
export function useCommentActions(concernId: number, initialCount: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const refresh = (countDelta: number) => {
    if (countDelta !== 0) {
      queryClient.setQueryData<number>(commentCountKey(concernId, initialCount), (count) =>
        Math.max(0, (count ?? 0) + countDelta),
      );
    }
    return queryClient.invalidateQueries({ queryKey: concernCommentsKey(concernId) });
  };

  const create = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: number }) =>
      createComment(concernId, content, parentId),
    onSuccess: (_data, { parentId }) => refresh(parentId === undefined ? 1 : 0),
    onError: (error, { parentId }) =>
      toast.show({
        message: failureMessage(
          error,
          parentId === undefined ? '답변을 등록하지 못했어요' : '답글을 등록하지 못했어요',
        ),
        tone: 'error',
      }),
  });

  const remove = useMutation({
    mutationFn: ({ commentId }: { commentId: number; isRoot: boolean }) =>
      deleteComment(concernId, commentId),
    onSuccess: (_data, { isRoot }) => refresh(isRoot ? -1 : 0),
  });

  return { create, remove };
}

/**
 * 실패 문구. 404 는 그 사이 지워진 답변(답글을 달려던 부모 포함) 이거나 내려간 글이다. 403 은 정지·탈퇴
 * 계정이거나 남의 것을 지우려 한 경우다 — 백엔드가 주는 문구가 사유를 가장 정확히 말하므로 본문의
 * `message` 를 그대로 쓴다.
 */
export function failureMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    if (error.status === 404) {
      return '이미 삭제된 댓글이거나 내려간 글이에요';
    }
    if (error.status === 403) {
      return readServerMessage(error.body) ?? fallback;
    }
  }
  return `${fallback}. 잠시 뒤 다시 시도해 주세요`;
}

function readServerMessage(body: string): string | null {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      const { message } = parsed as { message: unknown };
      return typeof message === 'string' && message ? message : null;
    }
  } catch {
    // 본문이 JSON 이 아니면(스프링의 평문 오류 등) 기본 문구로 떨어진다.
  }
  return null;
}
