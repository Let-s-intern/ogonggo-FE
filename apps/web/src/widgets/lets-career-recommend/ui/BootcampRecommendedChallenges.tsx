import {
  listPublicRecommendedChallenges,
  type SuccessResponseListUserRecommendedChallengeResponse,
  type UserRecommendedChallengeResponse,
} from '@ogonggo/api';
import { toChallengeItems } from '../lib/recommendItems';
import { RecommendSection } from './RecommendSection';

/**
 * 추천 챌린지를 받는다. 생성 타입은 `{ data, status }` 로 감싼 응답을 가정하지만 `httpClient` 는 본문을
 * 그대로 돌려준다(`widgets/job-detail/ui/JobDetailView.tsx` 와 같은 이유).
 *
 * 실패하면 빈 목록이다. 추천 구역 하나 때문에 상세 화면 전체가 오류가 되면 안 된다.
 */
async function fetchRecommendedChallenges(): Promise<UserRecommendedChallengeResponse[]> {
  try {
    const response =
      (await listPublicRecommendedChallenges()) as unknown as SuccessResponseListUserRecommendedChallengeResponse;
    return response.data ?? [];
  } catch {
    return [];
  }
}

/**
 * 교육·부트캠프 상세의 렛츠커리어 추천 — 모집 중인 챌린지 최대 3개(`GET /api/v1/recommended-challenges`).
 * 공고별 추천 API 는 공고 전용이고 교육용은 없어서 교육과 상관없는 목록이다. 그래서 공고용 제목을 쓰지
 * 않는다. 모집 중인 챌린지가 없으면 구역 전체를 그리지 않는다.
 */
export async function BootcampRecommendedChallenges() {
  const challenges = await fetchRecommendedChallenges();
  if (challenges.length === 0) {
    return null;
  }

  return <RecommendSection title="함께 보면 좋아요" items={toChallengeItems(challenges)} />;
}
