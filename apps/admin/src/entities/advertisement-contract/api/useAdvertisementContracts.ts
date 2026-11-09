import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdvertisementContractProduct,
  deleteAdvertisementContractProduct,
  getAdvertisementContract,
  listAdvertisementContracts,
  listAdvertisementExposures,
  updateAdvertisementContractPaymentAmount,
  updateAdvertisementContractStatus,
  type ChangeAdminAdvertisementContractStatusRequestStatus,
  type ListAdvertisementContractsParams,
  type ListAdvertisementContractsStatusItem,
} from '@ogonggo/api/src/admin';
import { omitEmpty } from '@/shared/api/omitEmpty';
import { unwrapData } from '@/shared/api/unwrapData';

/**
 * 광고 계약(BE LC-3583·3584, `비즈니스 > 광고 계약`). 광고 신청 폼으로 들어온 신청과 기업회원 공고 등록이 만든 계약이다.
 * 광고 문의(`advertisement-inquiries`)와는 별개다.
 */
const LIST_KEY = ['admin', 'advertisement-contracts'] as const;
const detailKey = (contractId: number) => [...LIST_KEY, 'detail', contractId] as const;

/** 목록 필터. URL 쿼리 그대로라 모두 문자열이고, 빈 문자열은 전체다. `status` 만 여러 개다. */
export interface ContractListFilters {
  page: number;
  source: string;
  status: ListAdvertisementContractsStatusItem[];
  promotionTarget: string;
  category: string;
  companyName: string;
  /** 신청일 시작·끝(`YYYY-MM-DD`, 양끝 포함). */
  createdFrom: string;
  createdTo: string;
}

export function useContractList(filters: ContractListFilters) {
  const { status, ...rest } = filters;
  return useQuery({
    queryKey: [...LIST_KEY, 'list', filters],
    queryFn: () =>
      unwrapData(
        listAdvertisementContracts({
          // 값은 화면 선택지에서 오므로 스펙의 enum 과 같다.
          ...(omitEmpty(rest) as Omit<ListAdvertisementContractsParams, 'status'>),
          status: status.length > 0 ? status : undefined,
        }),
      ),
  });
}

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

export function useContract(contractId: number) {
  return useQuery({
    queryKey: detailKey(contractId),
    queryFn: () => unwrapData(getAdvertisementContract(contractId)),
    enabled: Number.isInteger(contractId),
  });
}

/** 쓰기가 끝나면 상세와 목록을 다시 받는다. 목록 칸(상태, 금액)도 바뀐다. */
function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: LIST_KEY });
}

/** 상태 변경. 신청 폼 계약만 된다. 비즈니스 공고 계약은 409 `ADVERTISEMENT_CONTRACT_FOLLOWS_REVIEW` 다. */
export function useChangeContractStatus(contractId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (status: ChangeAdminAdvertisementContractStatusRequestStatus) =>
      unwrapData(updateAdvertisementContractStatus(contractId, { status })),
    onSuccess: invalidate,
  });
}

/** 협의 금액. `null` 은 금액 없음, 0 은 0원이다. */
export function useChangePaymentAmount(contractId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (paymentAmount: number | null) =>
      unwrapData(updateAdvertisementContractPaymentAmount(contractId, { paymentAmount })),
    onSuccess: invalidate,
  });
}

/** 판매한 상품을 계약에 붙인다. 같은 상품을 여러 번 붙일 수 있다(기간을 나눠 파는 경우). */
export function useAddContractProduct(contractId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (productId: number) =>
      unwrapData(createAdvertisementContractProduct(contractId, { productId })),
    onSuccess: invalidate,
  });
}

export function useRemoveContractProduct(contractId: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (contractProductId: number) =>
      unwrapData(deleteAdvertisementContractProduct(contractId, contractProductId)),
    onSuccess: invalidate,
  });
}

/**
 * 이 계약에 걸린 노출. 노출 목록은 상품(자리)별로만 부를 수 있어 계약에 붙인 상품마다 `?productId=&contractId=` 를 불러
 * 모은다(PRD 4절). 같은 상품을 여러 번 붙였으면 한 번만 부른다. 노출 키 아래에 두어 배너 세팅에서 바꾸면 함께 다시 받는다.
 */
export function useContractExposures(contractId: number, productIds: number[]) {
  const unique = [...new Set(productIds)];
  return useQueries({
    queries: unique.map((productId) => ({
      queryKey: ['admin', 'advertisement-exposures', productId, contractId],
      queryFn: async () =>
        (await unwrapData(listAdvertisementExposures({ productId, contractId, size: 100 })))
          ?.items ?? [],
    })),
    combine: (results) => ({
      data: results.flatMap((result) => result.data ?? []),
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
    }),
  });
}
