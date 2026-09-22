'use client';

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { HttpError } from '@ogonggo/api';
import { useToast } from '@ogonggo/ui';
import {
  moveApplicationStage,
  type ApplicationBoardItem,
  type ApplicationBoardPage,
  type MovableStageId,
} from '../api/applicationBoardApi';
import { canMoveStage, type ApplicationBoardTab, type ApplicationStageId } from './stages';

type StageData = InfiniteData<ApplicationBoardPage, number>;

export interface MoveStageRequest {
  item: ApplicationBoardItem;
  from: ApplicationStageId;
  to: MovableStageId;
}

export interface MoveStage {
  /** 요청이 도는 중. 이 동안 같은 훅의 다른 이동도 막힌다. */
  pending: boolean;
  /**
   * 옮긴다. **옮길 수 없는 전이면 요청이 나가지 않고** 왜 막혔는지 토스트로 알린다
   * (PRD 완료 조건 "옮길 수 없는 단계로 가는 조작은 막히고, 왜 막혔는지 알 수 있다").
   */
  move: (request: MoveStageRequest) => void;
}

/**
 * 카드 한 장을 다른 단계로 옮긴다(PRD "스크랩 ↔ 지원 준비 중을 옮길 수 있다").
 *
 * 누르는 즉시 두 칸의 캐시를 고쳐 카드를 옮기고 요청을 보낸다. 응답을 기다린 뒤에 옮기면 누를
 * 때마다 한 박자 늦어 두 번 누르게 된다 — 북마크 토글과 같은 방식이다
 * (`features/bookmark/model/useToggleBookmark.ts`). 실패하면 캐시를 되돌리고 토스트로 알린다.
 *
 * 되돌릴 자리는 필터가 걸린 목록까지 전부다. 같은 칸이어도 검색어가 다르면 다른 캐시라
 * (`applicationStageKey`) 접두사로 한꺼번에 집는다.
 */
export function useMoveStage(tab: ApplicationBoardTab): MoveStage {
  const queryClient = useQueryClient();
  const toast = useToast();
  const tabKey = ['application-board', tab];

  const mutation = useMutation({
    mutationFn: ({ item, to }: MoveStageRequest) => moveApplicationStage(tab, item.id, to),
    onMutate: async ({ item, from, to }) => {
      await queryClient.cancelQueries({ queryKey: tabKey });
      const previous = queryClient.getQueriesData<StageData>({ queryKey: tabKey });
      queryClient.setQueriesData<StageData>(
        { queryKey: [...tabKey, from] },
        (data) => data && withoutItem(data, item.id),
      );
      queryClient.setQueriesData<StageData>(
        { queryKey: [...tabKey, to] },
        (data) => data && withItem(data, item),
      );
      return { previous };
    },
    onError: (error, _request, context) => {
      for (const [key, data] of context?.previous ?? []) {
        queryClient.setQueryData(key, data);
      }
      toast.show({ message: failureMessage(error), tone: 'error' });
    },
    onSettled: () => {
      // 먼저 고쳐 둔 칸들을 서버 상태로 다시 맞춘다. 개수도 여기서 제자리를 찾는다.
      void queryClient.invalidateQueries({ queryKey: tabKey });
    },
  });

  return {
    pending: mutation.isPending,
    move: (request) => {
      if (!canMoveStage(tab, request.from, request.to)) {
        toast.show({ message: BLOCKED_MESSAGE, tone: 'error' });
        return;
      }
      if (mutation.isPending) {
        return;
      }
      mutation.mutate(request);
    },
  };
}

/**
 * 막힌 전이를 눌렀을 때. 화면은 애초에 그 선택지를 비활성으로 그리지만, 목록을 받아 둔 사이에
 * 다른 탭에서 단계가 바뀌면 여기까지 올 수 있다.
 */
const BLOCKED_MESSAGE = '아직 옮길 수 없는 단계예요';

function withoutItem(data: StageData, id: number): StageData {
  let removed = 0;
  const pages = data.pages.map((page) => {
    const items = page.items.filter((item) => item.id !== id);
    removed += page.items.length - items.length;
    return { ...page, items, pageInfo: page.pageInfo };
  });
  return withTotalDelta({ ...data, pages }, -removed);
}

function withItem(data: StageData, item: ApplicationBoardItem): StageData {
  const [first, ...rest] = data.pages;
  if (!first || first.items.some((existing) => existing.id === item.id)) {
    return data;
  }
  // 옮긴 것은 그 칸의 맨 앞에 온다 — 백엔드의 `prepare` 설명이 그렇게 적고 있다.
  const pages = [{ ...first, items: [item, ...first.items] }, ...rest];
  return withTotalDelta({ ...data, pages }, 1);
}

/** 칸 머리의 개수는 첫 페이지의 `totalElements` 에서 나온다(`useApplicationStage`). */
function withTotalDelta(data: StageData, delta: number): StageData {
  if (delta === 0) {
    return data;
  }
  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === 0
        ? {
            ...page,
            pageInfo: {
              ...page.pageInfo,
              totalElements: Math.max(0, page.pageInfo.totalElements + delta),
            },
          }
        : page,
    ),
  };
}

/**
 * 409 는 백엔드가 막은 전이다 — 사이드·스터디에서 이미 지원 완료·활동 중·활동 완료인 건을
 * 되돌리려 할 때 온다. 404 는 그사이 내려간 글이다.
 */
function failureMessage(error: unknown): string {
  if (!(error instanceof HttpError)) {
    return '단계를 옮기지 못했어요. 잠시 뒤 다시 시도해 주세요';
  }
  switch (error.status) {
    case 409:
      return '이미 지원한 건이라 되돌릴 수 없어요';
    case 404:
      return '내려간 공고라 옮길 수 없어요';
    default:
      return '단계를 옮기지 못했어요. 잠시 뒤 다시 시도해 주세요';
  }
}
