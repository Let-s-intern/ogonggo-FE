'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subscribeTokens } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import {
  fetchApplicationBoardPage,
  type ApplicationBoardFilters,
  type ApplicationBoardItem,
  type ApplicationBoardPage,
} from '../api/applicationBoardApi';
import type { ApplicationBoardTab, ApplicationStageId } from './stages';

/** 칸 하나가 한 번에 받아 오는 건수. 칸 하단의 `더보기` 가 이만큼씩 더 받는다. */
const DEFAULT_PAGE_SIZE = 12;

/**
 * 무효화하는 쪽(단계 이동) 도 이것을 쓴다. 탭까지가 접두사라 탭 하나만 통째로 버릴 수 있다.
 *
 * 필터가 키에 들어간다. 같은 칸이어도 검색어가 다르면 다른 목록이다.
 */
export function applicationStageKey(
  tab: ApplicationBoardTab,
  stageId: string,
  pageSize: number,
  filters: ApplicationBoardFilters = {},
) {
  return [
    'application-board',
    tab,
    stageId,
    pageSize,
    filters.recruitmentStatus ?? null,
    filters.keyword ?? null,
  ] as const;
}

export interface ApplicationStageList {
  items: readonly ApplicationBoardItem[];
  /** 칸 머리의 개수. 지금 받아 온 건수가 아니라 **서버가 센 전체 건수**다. */
  total: number;
  /** 첫 페이지를 기다리는 중. 칸 안을 자리표시자로 채울지가 이걸로 갈린다. */
  loading: boolean;
  failed: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
}

/**
 * 한 탭의 한 단계를 채우는 훅(PRD "셋 다 실데이터다").
 *
 * **브라우저에서 부른다.** 마이페이지는 SSR 이 필요 없고, 토큰이 브라우저 저장소에만 있어
 * 서버에서 부르면 `Authorization` 이 붙지 않는다 — 그러면 내 북마크가 한 건도 오지 않는다.
 *
 * **칸 하나가 훅 하나다.** 단계별로 요청이 갈라지는 이유는 `applicationBoardApi.ts` 에 적었다.
 * 부르는 쪽은 칸 컴포넌트가 `stagesOf(tab)` 을 돌며 하나씩 그리면 된다.
 *
 * 비로그인·기업 회원에게는 부르지 않는다. 이 화면이 일반 회원 마이페이지에만 있다.
 */
export function useApplicationStage<Tab extends ApplicationBoardTab>(
  tab: Tab,
  stageId: ApplicationStageId<Tab>,
  options: ApplicationBoardFilters & { pageSize?: number } = {},
): ApplicationStageList {
  const { pageSize = DEFAULT_PAGE_SIZE, ...filters } = options;
  const account = useMyAccount();
  const enabled = account.kind === 'ready' && account.account.role !== 'COMPANY';
  const queryClient = useQueryClient();

  /*
   * 로그인·로그아웃이 바뀌면 받아 둔 것을 버린다. 계정이 바뀌는 것이라 앞 사람의 목록을
   * 잠깐이라도 그리면 안 된다 — `enabled` 만으로는 캐시에 남은 값이 그대로 보인다.
   */
  useEffect(
    () => subscribeTokens(() => queryClient.removeQueries({ queryKey: ['application-board'] })),
    [queryClient],
  );

  const query = useInfiniteQuery({
    queryKey: applicationStageKey(tab, stageId, pageSize, filters),
    queryFn: ({ pageParam }) =>
      fetchApplicationBoardPage(tab, stageId, { ...filters, page: pageParam, size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last: ApplicationBoardPage) =>
      last.pageInfo.pageNum < last.pageInfo.totalPages ? last.pageInfo.pageNum + 1 : undefined,
    enabled,
  });

  const pages = query.data?.pages ?? [];
  return {
    items: pages.flatMap((page) => page.items),
    // 첫 페이지가 오기 전에는 셀 수 있는 것이 없다. 0 을 그리면 빈 칸으로 읽힌다.
    total: pages[0]?.pageInfo.totalElements ?? 0,
    loading: enabled && query.isPending,
    failed: query.isError,
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
  };
}
