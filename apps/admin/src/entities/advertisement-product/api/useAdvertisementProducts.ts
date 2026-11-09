import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdvertisementProduct,
  deleteAdvertisementProduct,
  listAdvertisementProducts,
  replaceAdvertisementProduct,
  type AdminAdvertisementProductResponse,
  type CreateAdminAdvertisementProductRequest,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

export type AdvertisementProduct = AdminAdvertisementProductResponse;
export type AdvertisementProductInput = CreateAdminAdvertisementProductRequest;

const LIST_KEY = ['admin', 'advertisement-products'] as const;

/**
 * 광고 상품(BE LC-3583). 상품은 많아야 수십 개라 한 번에 100건(서버 최대)을 받는다. 지운 상품은 오지 않는다.
 * 배너 세팅도 자리마다 상품을 찾으려고 같은 목록을 쓴다.
 */
export function useAdvertisementProducts() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: async () => (await unwrapData(listAdvertisementProducts({ size: 100 })))?.items ?? [],
  });
}

/** 등록과 수정. 수정은 `PUT` 전체 교체라 모든 칸을 보낸다. */
export function useSaveAdvertisementProduct(productId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdvertisementProductInput) => {
      if (productId === null) await unwrapData(createAdvertisementProduct(input));
      else await unwrapData(replaceAdvertisementProduct(productId, input));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useDeleteAdvertisementProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => unwrapData(deleteAdvertisementProduct(productId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}
