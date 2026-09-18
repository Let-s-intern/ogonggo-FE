import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listRejections,
  updateRejection,
  type AdminRejectionResponse as RejectionListItem,
  type AdminRejectionResponseType as RejectionTargetType,
  type ListRejectionsParams,
} from '@ogonggo/api/src/admin';
import { omitEmpty } from '@/shared/api/omitEmpty';
import { unwrapData } from '@/shared/api/unwrapData';

export type { RejectionListItem, RejectionTargetType };

export interface RejectionListFilters {
  page: number;
  keyword: string;
  type: string;
}

export function useRejectionList(filters: RejectionListFilters) {
  return useQuery({
    queryKey: ['admin', 'rejections', filters],
    queryFn: () => unwrapData(listRejections(omitEmpty({ ...filters }) as ListRejectionsParams)),
  });
}

/** 보낸 반려 사유를 고친다. 지우는 길은 없다 — 빈 사유는 아무것도 알려주지 못한다. */
export function useUpdateRejectionReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id, reason }: { type: RejectionTargetType; id: number; reason: string }) =>
      unwrapData(updateRejection(type.toLowerCase(), id, { reason })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'rejections'] });
    },
  });
}
