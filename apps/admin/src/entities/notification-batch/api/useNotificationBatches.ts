import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createNotificationBatch,
  getGetRecentNotificationResultsQueryKey,
  getRecentNotificationResults,
  type CreateNotificationBatchRequest,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

/**
 * 알림 발송(PRD `prd-notifications.md` "범위 4"). 발송 요청, 발송 결과 상세, 최근 발송 작업 셋이다.
 *
 * 발송은 서버에 멱등 처리가 없다 — POST 마다 새 발송이다. 실패해도 다시 보내지 않는다(뮤테이션 기본값).
 * 보낸 뒤에는 최근 발송 작업 표를 다시 받는다. 방금 적재한 작업이 위에 올라온다.
 */
export function useCreateNotificationBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateNotificationBatchRequest) =>
      unwrapData(createNotificationBatch(request)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getGetRecentNotificationResultsQueryKey() });
    },
  });
}

/**
 * 최근 수정된 발송 작업 100건. 페이지·필터 없이 서버 순서(`updatedAt` 내림차순) 그대로다. 관리자 발송뿐 아니라
 * 댓글 푸시·알림톡·이메일 작업도 섞여 온다.
 */
export function useRecentNotificationResults() {
  return useQuery({
    queryKey: getGetRecentNotificationResultsQueryKey(),
    queryFn: () => unwrapData(getRecentNotificationResults()),
  });
}
