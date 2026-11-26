import { useQuery } from '@tanstack/react-query';
import { fetchPreviewDeployments } from '@/shared/api/previewDeployments';

export type {
  PreviewApp,
  PreviewDeployment,
  PreviewDeploymentsResult,
  PreviewState,
} from '@/shared/api/previewDeployments';

const PREVIEW_DEPLOYMENTS_KEY = ['admin', 'preview-deployments'] as const;

const POLL_MS = 10_000;

/**
 * 프리뷰 배포 목록. 화면이 열려 있는 동안 10초마다 다시 부른다. Vercel 은 배포 상태를 밀어 주지 않아 폴링이다.
 *
 * 탭이 숨겨지면 멈춘다. React Query 의 `refetchIntervalInBackground` 기본값(`false`)이 하는 일이라 따로 만들지
 * 않았고, 탭으로 돌아오면 `refetchOnWindowFocus` 가 바로 한 번 부른다.
 *
 * 갱신 중에는 `isPending` 이 아니라 `isFetching` 만 켜지고 이전 `data` 가 그대로 남아 목록이 깜빡이지 않는다. 한 번
 * 실패해도 이전 `data` 는 남는다.
 *
 * 재시도를 끈다. 토큰 없음(503)이나 로그인 없음(401)은 다시 불러도 같고, 10초 뒤 폴링이 어차피 다시 부른다.
 */
export function usePreviewDeployments() {
  return useQuery({
    queryKey: PREVIEW_DEPLOYMENTS_KEY,
    queryFn: fetchPreviewDeployments,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
