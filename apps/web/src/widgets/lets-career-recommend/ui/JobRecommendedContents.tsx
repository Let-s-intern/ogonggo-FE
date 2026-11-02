import {
  listPublicJobRecommendedLetsCareerContents,
  type SuccessResponseListUserRecommendedLetsCareerContentResponse,
  type UserRecommendedLetsCareerContentResponse,
} from '@ogonggo/api';
import { toContentItems } from '../lib/recommendItems';
import { RecommendSection } from './RecommendSection';

/**
 * 공고에 맞춘 추천 콘텐츠를 받는다. 생성 타입은 `{ data, status }` 로 감싼 응답을 가정하지만
 * `httpClient` 는 본문을 그대로 돌려준다(`widgets/job-detail/ui/JobDetailView.tsx` 와 같은 이유).
 *
 * 실패하면 빈 목록이다. 추천 구역 하나 때문에 상세 화면 전체가 오류가 되면 안 된다.
 */
async function fetchRecommendedContents(
  jobId: number,
): Promise<UserRecommendedLetsCareerContentResponse[]> {
  try {
    const response = (await listPublicJobRecommendedLetsCareerContents(
      jobId,
    )) as unknown as SuccessResponseListUserRecommendedLetsCareerContentResponse;
    return response.data ?? [];
  } catch {
    return [];
  }
}

/**
 * 채용공고 상세의 렛츠커리어 추천 — 그 공고의 직군·직무와 요구 서류·전형으로 고른 자료집·블로그·
 * 프로그램(`GET /api/v1/jobs/{jobId}/recommended-lets-career-contents`). 카드 주소는 응답의 `url` 을
 * 그대로 쓴다. 빈 배열이 오거나 부르기에 실패하면 구역 전체를 그리지 않는다.
 */
export async function JobRecommendedContents({ jobId }: { jobId: number }) {
  const contents = await fetchRecommendedContents(jobId);
  if (contents.length === 0) {
    return null;
  }

  return (
    <RecommendSection
      title="이 공고, 더 탄탄하게 준비하고 싶다면?"
      description="지금 보고 있는 공고의 직무 · 제출 서류에 맞춰 준비했어요."
      items={toContentItems(contents)}
    />
  );
}
