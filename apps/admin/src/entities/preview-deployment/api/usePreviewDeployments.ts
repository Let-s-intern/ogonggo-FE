import { useQuery } from '@tanstack/react-query';
import {
  fetchPreviewDeployments,
  type PreviewDeploymentsQuery,
} from '@/shared/api/previewDeployments';

export type {
  PreviewApp,
  PreviewAppFilter,
  PreviewDeployment,
  PreviewDeploymentsQuery,
  PreviewDeploymentsResult,
  PreviewState,
  PreviewTarget,
} from '@/shared/api/previewDeployments';

const POLL_MS = 10_000;

/**
 * 배포 목록 한 페이지. 탭(`target`)과 앱 필터(`app`)와 페이지(`cursor`)마다 캐시가 따로다.
 *
 * 10초 폴링은 첫 페이지(`cursor` 없음)에서만 돈다. Vercel 은 배포 상태를 밀어 주지 않아 폴링이지만, 2페이지 이후는
 * 항상 더 오래된 배포라 바뀔 일이 적고, 넘겨 보는 중에 목록이 밀리면 오히려 헷갈린다. 탭이 숨겨지면 멈춘다
 * (`refetchIntervalInBackground` 기본값 `false`). 돌아오면 `refetchOnWindowFocus` 가 바로 한 번 부른다.
 *
 * 같은 탭과 앱 안에서 페이지를 넘기는 동안은 이전 페이지를 남겨 둔다(`isPlaceholderData`). 탭이나 앱을 바꿀 때는
 * 남기지 않는다. 운영 탭에 프리뷰 배포가 잠깐 보이면 틀린 목록을 믿게 된다. 같은 키를 다시 부르는 갱신은 이전
 * `data` 가 그대로 있어 깜빡이지 않고, 한 번 실패해도 남는다.
 *
 * 재시도를 끈다. 토큰 없음(503)이나 로그인 없음(401)은 다시 불러도 같고, 폴링이 어차피 다시 부른다.
 */
export function usePreviewDeployments(query: PreviewDeploymentsQuery) {
  return useQuery({
    queryKey: ['admin', 'preview-deployments', query.target, query.app, query.cursor],
    queryFn: () => fetchPreviewDeployments(query),
    refetchInterval: query.cursor === null ? POLL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
    placeholderData: (previousData, previousQuery) => {
      const [, , target, app] = previousQuery?.queryKey ?? [];
      return target === query.target && app === query.app ? previousData : undefined;
    },
  });
}
