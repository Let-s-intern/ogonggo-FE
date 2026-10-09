'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import type { PageInfo } from '@ogonggo/api';
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
 * 답변 목록. `답변 더보기` 로 다음 페이지를 이어 붙인다.
 *
 * 브라우저에서만 부른다. `mine`·`liked` 가 요청의 토큰으로 정해지는데 서버 컴포넌트의 요청에는 토큰이
 * 실리지 않는다(`shared/api/authTokens.ts`). 답변 목록은 처음부터 클라이언트에서 읽는다(PRD 결정 8).
 */
export function useRootComments(concernId: number) {
  const signedIn = useSignedIn();
  return useInfiniteQuery({
    queryKey: rootCommentsKey(concernId, signedIn),
    queryFn: ({ pageParam }) => fetchRootComments(concernId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => nextPage(last.pageInfo),
  });
}

/**
 * 앞쪽 5 건 뒤의 답글. 앞쪽 5 건이 1 페이지이므로 2 페이지부터 읽는다(`REPLY_PAGE_SIZE`).
 * `답글 더보기` 를 처음 누르기 전에는 부르지 않는다.
 */
export function useMoreReplies(concernId: number, parentId: number, enabled: boolean) {
  const signedIn = useSignedIn();
  return useInfiniteQuery({
    queryKey: repliesKey(concernId, parentId, signedIn),
    queryFn: ({ pageParam }) => fetchReplies(concernId, parentId, pageParam),
    initialPageParam: 2,
    getNextPageParam: (last) => nextPage(last.pageInfo),
    enabled,
  });
}
