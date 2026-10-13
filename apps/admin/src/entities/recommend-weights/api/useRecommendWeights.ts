import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLetsCareerContentRecommendWeights,
  replaceLetsCareerContentRecommendWeights,
  type AdminLetsCareerContentRecommendWeightsResponse,
  type ReplaceAdminLetsCareerContentRecommendWeightsRequest,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

export type RecommendWeights = AdminLetsCareerContentRecommendWeightsResponse;
export type RecommendWeightsInput = ReplaceAdminLetsCareerContentRecommendWeightsRequest;

const RECOMMEND_WEIGHTS_KEY = ['admin', 'recommend-weights'] as const;

/**
 * 렛츠커리어 콘텐츠 추천 점수 여덟 칸. 바꾼 적이 없으면 서버의 기본값이 온다.
 *
 * 기본값은 백엔드 상수라 화면에 복사해 두지 않는다. 이 값이 도착한 뒤에 폼을 그린다.
 */
export function useRecommendWeights() {
  return useQuery({
    queryKey: RECOMMEND_WEIGHTS_KEY,
    queryFn: () => unwrapData(getLetsCareerContentRecommendWeights()),
  });
}

/**
 * 추천 점수 저장. `PUT` 이라 여덟 칸을 모두 보낸다 — 하나만 바꿔도 전체를 보내고, 빠진 칸이
 * 있으면 서버가 400 `BAD_REQUEST` 를 준다. 바뀐 값은 다음 추천 요청부터 운영에 바로 쓰인다.
 *
 * 응답의 `data` 는 서버에 저장된 값이다. 성공하면 조회 캐시를 새로 한다.
 */
export function useSaveRecommendWeights() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecommendWeightsInput) =>
      unwrapData(replaceLetsCareerContentRecommendWeights(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECOMMEND_WEIGHTS_KEY });
    },
  });
}
