'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdPostings, type AdPostingPosition } from './fetchAdPostings';

/**
 * 브라우저에서 그리는 자리(마이페이지 보드)의 광고 공고. 서버 컴포넌트 자리와 같은 `fetchAdPostings` 를 부르고, 실패하면
 * 빈 목록이다. 광고는 자주 바뀌지 않아 한 번 받은 것을 1분 쓴다.
 */
export function useAdPostings(position: Exclude<AdPostingPosition, 'JOB_LIST'>) {
  return useQuery({
    queryKey: ['ad-postings', position],
    queryFn: () => fetchAdPostings(position),
    staleTime: 60_000,
  });
}
