import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '@ogonggo/api';
import {
  createNotificationBatch,
  getGetNotificationBatchQueryKey,
  getGetRecentNotificationResultsQueryKey,
  getNotificationBatch,
  getRecentNotificationResults,
  type CreateNotificationBatchRequest,
} from '@ogonggo/api/src/admin';
import { authErrorMessage } from '@/shared/api/authErrorMessages';
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

/**
 * 전송 내역의 관리자 발송 줄에 제목·본문을 붙이려고 묶음 상세를 받는다. 발송 작업 응답에는 payload 가 없고, 관리자
 * 발송만 `batchId` 로 내용을 되찾을 수 있다. 같은 묶음은 한 번만 받는다(상세 화면과 같은 캐시 키). 결과 조회 기간(30일)
 * 이 지나 404 면 제목 없이 둔다 — 다시 보내지 않는다. 여기서는 폴링하지 않는다.
 *
 * 돌려주는 맵은 `batchId` → 상세다. 아직 오지 않았거나 못 받은 묶음은 맵에 없다.
 */
export function useNotificationBatchContents(batchIds: readonly string[]) {
  const unique: string[] = [...new Set(batchIds)];
  return useQueries({
    queries: unique.map((batchId) => ({
      queryKey: getGetNotificationBatchQueryKey(batchId),
      queryFn: () => unwrapData(getNotificationBatch(batchId)),
      staleTime: 60_000,
      retry: false,
    })),
    combine: (results) =>
      new Map(
        results.flatMap((result, index) => {
          const batchId = unique[index];
          return batchId && result.data ? [[batchId, result.data] as const] : [];
        }),
      ),
  });
}

/** 발송 결과 상세를 다시 받는 간격. `completed=false` 인 동안만 돈다(PRD "결정한 것" 8). */
const BATCH_POLL_INTERVAL_MS = 10_000;

/** 없는 묶음이거나 결과 조회 기간(30일)이 지났다. 백엔드 코드는 `NOTIFICATION_BATCH_NOT_FOUND` 다. */
export const isNotificationBatchNotFound = (error: unknown) =>
  error instanceof HttpError && error.status === 404;

/**
 * 발송 결과 상세. 처리가 끝나지 않았으면(`completed=false`) 10초마다 다시 받고, 끝나면 멈춘다. 끝난 뒤에도 미확정
 * 건이 늦게 정정될 수 있지만 그것까지 기다리며 돌지는 않는다 — 화면을 다시 열면 새로 받는다.
 *
 * 404 는 다시 보내지 않는다. 기다려도 같다. 401·403 도 앱 기본값처럼 다시 보내지 않는다.
 */
export function useNotificationBatch(batchId: string) {
  return useQuery({
    queryKey: getGetNotificationBatchQueryKey(batchId),
    queryFn: () => unwrapData(getNotificationBatch(batchId)),
    refetchInterval: (query) =>
      query.state.data && !query.state.data.completed ? BATCH_POLL_INTERVAL_MS : false,
    retry: (failureCount, error) =>
      !authErrorMessage(error) && !isNotificationBatchNotFound(error) && failureCount < 3,
  });
}
