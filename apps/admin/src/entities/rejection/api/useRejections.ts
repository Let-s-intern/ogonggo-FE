import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RejectionListItem } from '@ogonggo/api/src/mocks/admin/rejections';
import type { RejectionTargetType } from '@ogonggo/api/src/mocks/fixtures/admin-rejection';
import { adminGet, adminWrite, type PageResponse } from '@/shared/api/adminClient';

export type { RejectionListItem, RejectionTargetType };

export interface RejectionListFilters {
  page: number;
  keyword: string;
  type: string;
}

export function useRejectionList(filters: RejectionListFilters) {
  return useQuery({
    queryKey: ['admin', 'rejections', filters],
    queryFn: () =>
      adminGet<PageResponse<RejectionListItem>>('/api/v1/admin/rejections', { ...filters }),
  });
}

/** 보낸 반려 사유를 고친다. 지우는 길은 없다 — 빈 사유는 아무것도 알려주지 못한다. */
export function useUpdateRejectionReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id, reason }: { type: RejectionTargetType; id: number; reason: string }) =>
      adminWrite('PATCH', `/api/v1/admin/rejections/${type.toLowerCase()}/${id}`, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'rejections'] });
    },
  });
}
