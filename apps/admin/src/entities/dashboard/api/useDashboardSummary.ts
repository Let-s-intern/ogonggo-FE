import { httpClient } from '@ogonggo/api';
import { useQuery } from '@tanstack/react-query';
import type {
  AdminDashboardSummary,
  AdminDashboardSummaryResponse,
} from '@ogonggo/api/src/mocks/fixtures/admin-dashboard';
import { isBackendPending } from '@/shared/config/backendPending';

/**
 * `GET /api/v1/admin/dashboard/summary`.
 *
 * 어드민 API 는 아직 백엔드에 없어서 orval 생성 클라이언트에 이 호출이 없다. 그래서 응답 타입을
 * MSW 픽스처가 내보내는 것에서 가져온다 — 그 타입이 지금은 계약 그 자체다. 백엔드가 생기면
 * 생성 타입으로 갈아끼우고 이 import 를 지운다.
 */
export function useDashboardSummary() {
  return useQuery<AdminDashboardSummary | undefined>({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: async () => {
      const response = await httpClient<AdminDashboardSummaryResponse>(
        '/api/v1/admin/dashboard/summary',
      );
      return response.data;
    },
    // 실서버 모드에는 부를 API 가 없다. 요청을 보내지 않고 화면이 안내를 그린다
    // (`@/shared/config/backendPending`).
    enabled: !isBackendPending,
  });
}
