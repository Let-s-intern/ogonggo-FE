'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HttpError } from '@ogonggo/api';
import { useToast } from '@ogonggo/ui';
import { createBookmark, deleteBookmark, type BookmarkKind } from '../api/bookmarkApi';
import { myBookmarkIdsKey, useMyBookmarkIds } from './useMyBookmarkIds';

export interface UseToggleBookmarkOptions {
  kind: BookmarkKind;
  id: number;
  /** 서버가 준 `bookmarked`. id 모음이 오기 전까지 이것을 그린다. */
  bookmarked: boolean;
}

export interface ToggleBookmark {
  /** 지금 그릴 값. id 모음이 있으면 그쪽이, 없으면 서버가 준 값이 이긴다. */
  bookmarked: boolean;
  /**
   * 이 화면에서 누른 만큼의 개수 변화. 상세의 북마크 개수가 서버 값에 더한다 — 등록·해제 응답에
   * 개수가 없어(`SuccessResponseUnit`) 서버 값으로 다시 맞출 수 없다.
   */
  countDelta: number;
  /** 요청이 도는 중. 이 동안 같은 버튼을 다시 눌러도 아무 일도 일어나지 않는다. */
  pending: boolean;
  toggle: () => void;
}

/**
 * 북마크를 누른 것을 처리한다(PRD "누르면 먼저 바꾸고, 실패하면 되돌린다").
 *
 * 누르는 즉시 id 모음을 고쳐 아이콘을 바꾸고 요청을 보낸다. 응답을 기다린 뒤에 바꾸면 누를
 * 때마다 한 박자 늦어 두 번 누르게 된다. 실패하면 모음을 되돌리고 토스트로 알린다.
 *
 * **응답이 오기 전 같은 버튼은 막는다.** 연타로 등록·해제가 엇갈려 도착하면 마지막 상태를 알 수
 * 없다. 막는 단위는 이 훅 하나, 곧 버튼 하나다 — 옆 카드의 북마크는 그대로 눌린다.
 */
export function useToggleBookmark({
  kind,
  id,
  bookmarked: serverBookmarked,
}: UseToggleBookmarkOptions): ToggleBookmark {
  const ids = useMyBookmarkIds(kind);
  const bookmarked = ids ? ids.has(id) : serverBookmarked;
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const [countDelta, setCountDelta] = useState(0);
  const key = myBookmarkIdsKey(kind);

  const mutation = useMutation({
    mutationFn: (next: boolean) => sendBookmark(kind, id, next),
    onMutate: async (next) => {
      // 도는 중인 내 목록 요청이 있으면 멈춘다. 옛 응답이 뒤늦게 도착해 방금 고친 모음을 덮는다.
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ReadonlySet<number>>(key);
      queryClient.setQueryData(key, withBookmark(previous, id, next));
      setCountDelta((delta) => delta + (next ? 1 : -1));
      return { previous };
    },
    onError: (error, next, context) => {
      queryClient.setQueryData(key, context?.previous);
      setCountDelta((delta) => delta - (next ? 1 : -1));
      toast.show({ message: failureMessage(error), tone: 'error' });
    },
    onSuccess: (_data, next) => {
      // 해제에는 토스트를 띄우지 않는다. 비워진 아이콘으로 충분하다(PRD "북마크에서 쓰는 문구").
      if (next) {
        toast.show({
          message: '스크랩한 공고에 담았어요',
          action: { label: '보기', onClick: () => router.push(`/mypage/scraps?tab=${kind}`) },
        });
      }
      // 먼저 바꿔 둔 모음을 서버 상태로 다시 맞춘다.
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    bookmarked,
    countDelta,
    pending: mutation.isPending,
    toggle: () => {
      if (mutation.isPending) {
        return;
      }
      mutation.mutate(!bookmarked);
    },
  };
}

/**
 * 등록의 409 는 성공으로 친다. 이미 걸려 있다는 뜻이고, 다른 탭에서 걸어 둔 경우에 생긴다 —
 * 원하는 상태가 서버에 이미 있는데 실패로 알리면 방금 채운 아이콘이 이유 없이 비워진다.
 *
 * 404 는 실패다. 그 사이 내려간 공고라 되돌리고 알린다.
 * 401 은 `shared/api/reissue.ts` 의 재발급 흐름이 먼저 받는다 — 재발급까지 실패하면 그 흐름이
 * 로그인 화면으로 보낸다.
 */
async function sendBookmark(kind: BookmarkKind, id: number, next: boolean): Promise<void> {
  if (!next) {
    await deleteBookmark(kind, id);
    return;
  }
  try {
    await createBookmark(kind, id);
  } catch (error) {
    if (error instanceof HttpError && error.status === 409) {
      return;
    }
    throw error;
  }
}

function withBookmark(
  ids: ReadonlySet<number> | undefined,
  id: number,
  next: boolean,
): ReadonlySet<number> {
  const updated = new Set(ids);
  if (next) {
    updated.add(id);
  } else {
    updated.delete(id);
  }
  return updated;
}

function failureMessage(error: unknown): string {
  return error instanceof HttpError && error.status === 404
    ? '내려간 공고라 북마크할 수 없어요'
    : '북마크를 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요';
}
