'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdPostingPlacement } from '@ogonggo/api';
import { fetchAdJobs } from './fetchAdPostings';

/**
 * 브라우저에서 그리는 자리(마이페이지 보드)의 광고 공고. 서버 컴포넌트 자리와 같은 `fetchAdJobs` 를 부른다. 실패하면
 * 빈 목록이다. 광고는 자주 바뀌지 않아 한 번 받은 것을 1분 쓴다.
 */
export function useAdJobs(placement: Exclude<AdPostingPlacement, 'BOOTCAMP_LIST'>) {
  return useQuery({
    queryKey: ['ad-postings', placement],
    queryFn: () => fetchAdJobs(placement),
    staleTime: 60_000,
  });
}
