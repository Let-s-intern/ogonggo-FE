import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  listContentRejections,
  updateContentRejection,
  type AdminContentRejectionResponse as RejectionListItem,
  type AdminContentRejectionResponseType as RejectionTargetType,
  type ListContentRejectionsParams,
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
    // 다음 페이지를 받는 동안 지금 페이지를 그대로 둔다. 비우면 표와 페이지 번호가 사라져 1페이지로 돌아간 것처럼 보인다.
    placeholderData: keepPreviousData,
    queryKey: ['admin', 'rejections', filters],
    queryFn: () =>
      unwrapData(listContentRejections(omitEmpty({ ...filters }) as ListContentRejectionsParams)),
  });
}

/** 보낸 반려 사유를 고친다. 지우는 길은 없다 — 빈 사유는 아무것도 알려주지 못한다. */
export function useUpdateRejectionReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id, reason }: { type: RejectionTargetType; id: number; reason: string }) =>
      unwrapData(updateContentRejection(type.toLowerCase(), id, { reason })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'rejections'] });
    },
  });
}
