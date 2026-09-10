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
 * `staleTime` 을 둬서 판정 직후 목록을 다시 받지 않는다. 다시 받으면 방금 처리한 건이 빠지며
 * 배열이 통째로 바뀌고, 보고 있던 위치가 흔들린다. 화면이 자기 인덱스를 직접 옮긴다.
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
 * 판정을 보낸다.
 *
 * 대시보드의 "검수 대기" 숫자가 이 판정으로 바뀌므로 함께 무효화한다. 큐 자체는 무효화하지
 * 않는다 — 위 `staleTime` 주석의 이유다.
 */
export function useDecideReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id, decision, reason }: ReviewDecisionInput) =>
      adminWrite('PATCH', pathOf(type, id), { decision, reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bootcamps'] });
    },
  });
}

/** 방금 내린 판정을 되돌린다. 키 하나로 통과되는 화면이라 되돌릴 길이 있어야 한다. */
export function useUndoReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: ReviewTargetType; id: number }) =>
      adminWrite('PATCH', `${pathOf(type, id)}/undo`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bootcamps'] });
    },
  });
}
