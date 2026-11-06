import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_AD_CONTRACTS_PATH,
  adminAdvertiserContractsPath,
  type AdminAdContractRequest,
  type AdminAdContractResponse,
} from '@ogonggo/api/src/ad-contracts';
import { adminDelete, adminGet, adminWrite } from '@/shared/api/adminClient';

export type AdContract = AdminAdContractResponse;
export type AdContractInput = AdminAdContractRequest;

/**
 * 광고 계약(이슈 #573). 백엔드가 아직 없어 손으로 적은 타입·주소(`@ogonggo/api/src/ad-contracts`)로 MSW 목을 부른다.
 * 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 의 "광고 계약".
 *
 * 키를 광고주 키 아래에 둔다. 배너·광고 공고 쓰기가 광고주 키를 비우므로(이어 둔 수가 바뀐다) 계약 목록도 함께 다시 받는다.
 */
export const adContractsQuery = (advertiserId: number) => ({
  queryKey: ['admin', 'advertisers', 'contracts', advertiserId] as const,
  queryFn: () => adminGet<AdContract[]>(adminAdvertiserContractsPath(advertiserId)),
});

/** 광고주 한 곳의 계약 전부. 시작이 늦은 것이 먼저 온다. `null` 이면 부르지 않는다(광고주를 고르기 전). */
export function useAdContracts(advertiserId: number | null) {
  return useQuery({
    ...adContractsQuery(advertiserId ?? 0),
    enabled: advertiserId !== null && Number.isInteger(advertiserId),
  });
}

/**
 * 계약 쓰기 뒤에는 광고주(합계)와 배너·광고 공고(표의 계약 표시, 삭제하면 끊긴다)를 다시 받는다.
 */
function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'advertisers'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'ad-postings'] }),
    ]);
}

/** 등록과 수정. 수정도 폼이 모든 칸을 들고 있어 모두 보낸다(배너와 같다). */
export function useSaveAdContract(advertiserId: number, contractId: number | null) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: AdContractInput) =>
      contractId === null
        ? adminWrite<AdContract>('POST', adminAdvertiserContractsPath(advertiserId), input)
        : adminWrite<AdContract>('PATCH', `${ADMIN_AD_CONTRACTS_PATH}/${contractId}`, input),
    onSuccess: invalidate,
  });
}

/** 삭제. 이어 둔 배너·광고 공고는 남고 계약만 끊긴다. */
export function useDeleteAdContract() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (contractId: number) => adminDelete(`${ADMIN_AD_CONTRACTS_PATH}/${contractId}`),
    onSuccess: invalidate,
  });
}
