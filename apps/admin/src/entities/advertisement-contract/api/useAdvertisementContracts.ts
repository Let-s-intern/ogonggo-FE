import { useQuery } from '@tanstack/react-query';
import { listAdvertisementContracts } from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

const LIST_KEY = ['admin', 'advertisement-contracts'] as const;

/**
 * 회사명으로 찾은 광고 계약(최신 신청 순 20건). 배너 노출의 `연결 계약` 고르기가 쓴다. 회사명이 비면 최근 계약이다.
 */
export function useContractSearch(companyName: string) {
  const keyword = companyName.trim();
  return useQuery({
    queryKey: [...LIST_KEY, 'search', keyword],
    queryFn: async () =>
      (
        await unwrapData(
          listAdvertisementContracts({ companyName: keyword || undefined, size: 20 }),
        )
      )?.items ?? [],
  });
}
