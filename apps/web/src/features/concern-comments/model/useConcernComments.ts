'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import type { PageInfo } from '@ogonggo/api';
import { ensureAccessToken } from '@/shared/api/reissue';
import { useSignedIn } from '@/shared/api/useSignedIn';
import {
  fetchReplies,
  fetchRootComments,
  repliesKey,
  rootCommentsKey,
} from '../api/concernCommentsApi';

/** 다음 페이지 번호. `pageInfo.pageNum` 은 1 부터다(백엔드 `PageResponse.fromZeroBased`). */
function nextPage(pageInfo: PageInfo): number | undefined {
  return pageInfo.pageNum < pageInfo.totalPages ? pageInfo.pageNum + 1 : undefined;
}

/**
 * 로그인한 사용자의 읽기는 캐시에 남기지 않는다. 키에는 로그인 여부(boolean) 만 있어서, 남겨 두면 로그아웃하고
 * 다른 계정으로 로그인해 같은 글을 열 때 앞 계정의 `mine`·`liked` 가 먼저 그려진다. 비로그인 읽기는 사람마다
 * 같은 값이라 기본값 그대로 둔다. `useConcernMine` 이 `gcTime: 0` 으로 같은 위험을 막는 것과 같다.
 */
function gcTimeFor(signedIn: boolean): number | undefined {
  return signedIn ? 0 : undefined;
}

/**
 * 답변 목록. `답변 더보기` 로 다음 페이지를 이어 붙인다.
 *
 * 브라우저에서만 부른다. `mine`·`liked` 가 요청의 토큰으로 정해지는데 서버 컴포넌트의 요청에는 토큰이
 * 실리지 않는다(`shared/api/authTokens.ts`). 답변 목록은 처음부터 클라이언트에서 읽는다(PRD 결정 8).
 *
 * 요청마다 먼저 액세스 토큰을 확보한다(`ensureAccessToken`). 이 읽기는 공개 API 라 토큰이 없거나 만료돼도 401 이
 * 아니라 비로그인 응답(`mine=false`, `liked=false`) 을 받아, 재발급 흐름이 걸리지 않은 채 내 답변·내 도움돼요가
 * 빠진다. 다음 쪽·무효화 뒤 다시 읽기·창에 돌아올 때의 재조회도 같은 요청이라 모두 이 앞을 지난다.
 */
export function useRootComments(concernId: number) {
  const signedIn = useSignedIn();
  return useInfiniteQuery({
    queryKey: rootCommentsKey(concernId, signedIn),
    queryFn: async ({ pageParam }) => {
      await ensureAccessToken();
      return fetchRootComments(concernId, pageParam);
    },
    initialPageParam: 1,
    getNextPageParam: (last) => nextPage(last.pageInfo),
    gcTime: gcTimeFor(signedIn),
  });
}

/**
 * 앞쪽 5 건 뒤의 답글. 앞쪽 5 건이 1 페이지이므로 2 페이지부터 읽는다(`REPLY_PAGE_SIZE`).
 * `답글 더보기` 를 처음 누르기 전에는 부르지 않는다. 토큰은 `useRootComments` 와 같이 요청마다 확보한다.
 */
export function useMoreReplies(concernId: number, parentId: number, enabled: boolean) {
  const signedIn = useSignedIn();
  return useInfiniteQuery({
    queryKey: repliesKey(concernId, parentId, signedIn),
    queryFn: async ({ pageParam }) => {
      await ensureAccessToken();
      return fetchReplies(concernId, parentId, pageParam);
    },
    initialPageParam: 2,
    getNextPageParam: (last) => nextPage(last.pageInfo),
    enabled,
    gcTime: gcTimeFor(signedIn),
  });
}
