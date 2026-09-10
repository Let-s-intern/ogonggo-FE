import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReviewQueueItem, ReviewTargetType } from '@ogonggo/api/src/mocks/admin/review';
import { adminGet, adminWrite } from '@/shared/api/adminClient';

export type { ReviewQueueItem, ReviewTargetType };

/**
 * 검수 대기 큐.
 *
 * 페이지를 나누지 않고 통째로 받는다. 운영자가 A/D 로 앞뒤를 오가는 화면이라 경계에서 다음
 * 페이지를 기다리면 흐름이 끊긴다. 큐가 수백 건이 되면 그때 나눈다.
 *
 * `staleTime` 을 둬서 저장 전까지 목록을 다시 받지 않는다. 다시 받으면 배열이 통째로 바뀌며
 * 보고 있던 위치가 흔들린다. 저장이 끝난 뒤에만 무효화한다.
 */
export function useReviewQueue() {
  return useQuery({
    queryKey: ['admin', 'review-queue'],
    queryFn: () => adminGet<ReviewQueueItem[]>('/api/v1/admin/review-queue'),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export interface ReviewDecisionInput {
  type: ReviewTargetType;
  id: number;
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
}

const pathOf = (type: ReviewTargetType, id: number) =>
  `/api/v1/admin/review-queue/${type.toLowerCase()}/${id}`;

/**
 * 모아 둔 판정을 한 번에 보낸다.
 *
 * 한 건씩 즉시 보내지 않는 이유는 되돌리기 때문이다. 키 하나로 통과되는 화면이라 오조작이
 * 실제로 일어나는데, 즉시 보내면 되돌리기도 왕복이 필요하고 그 사이 화면이 멈춘다. 판정을
 * 화면에 모아 두면 되돌리기가 즉시고, 저장은 마지막에 한 번이다.
 *
 * 순차로 보낸다. 목은 배열을 직접 고치므로 동시에 보내면 순서가 뒤엉킬 수 있고, 실패한 건이
 * 무엇인지도 흐려진다. 큐가 수백 건이 되면 백엔드에 묶음 API 를 요청한다.
 */
export function useSaveReviewDecisions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (decisions: ReviewDecisionInput[]) => {
      for (const entry of decisions) {
        await adminWrite('PATCH', pathOf(entry.type, entry.id), {
          decision: entry.decision,
          reason: entry.reason,
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bootcamps'] });
    },
  });
}
