import {
  listPublicRecommendedChallenges,
  type SuccessResponseListUserRecommendedChallengeResponse,
  type UserRecommendedChallengeResponse,
} from '@ogonggo/api';
import { letsCareerChallengeUrl } from '@/shared/api/letsCareerHandoff';

/**
 * 추천 챌린지를 받는다. 생성 타입은 `{ data, status }` 로 감싼 응답을 가정하지만 `httpClient` 는 본문을
 * 그대로 돌려준다(`widgets/job-detail/ui/JobDetailView.tsx` 와 같은 이유).
 *
 * 실패하면 빈 목록이다. 광고 구역 하나 때문에 상세 화면 전체가 오류가 되면 안 된다 — 백엔드도
 * 렛츠커리어가 응답하지 않으면 오류 대신 빈 목록을 준다.
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
 * "함께 보면 좋아요" — 렛츠커리어에서 모집 중인 챌린지 최대 3개(`GET /api/v1/recommended-challenges`).
 * 전에는 목업 문구를 하드코딩했다. 누르면 렛츠커리어 챌린지 상세를 새 탭으로 연다.
 *
 * 서버에서 토큰 없이 부른다. 로그인한 사람에게 맞춘 추천은 백엔드가 토큰을 받을 때 주는데, 이
 * 위젯은 서버 컴포넌트라 토큰이 없다. 지금은 렛츠커리어가 무작위로 고르므로 차이가 없다.
 *
 * 항목은 왼쪽에 한 줄 소개(회색)와 제목(굵게), 오른쪽에 4:3 썸네일이고 항목 사이에 가는 선이
 * 있다. 제목은 두 줄까지 보이고 넘치면 자른다 — 챌린지 이름은 기수까지 붙어 길다.
 *
 * 빈 목록이면 구역 전체를 그리지 않는다(API 설명의 규칙).
 *
 * 채용공고 상세와 교육·부트캠프 상세가 같은 것을 쓴다.
 */
export async function CrossSellWidget() {
  const challenges = await fetchRecommendedChallenges();
  if (challenges.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">함께 보면 좋아요</h2>
      <ul className="mt-1 divide-y divide-gray-100">
        {challenges.map((challenge) => (
          <li key={challenge.challengeId}>
            <a
              href={letsCareerChallengeUrl(challenge.challengeId)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 py-4"
            >
              <div className="min-w-0 flex-1">
                {challenge.shortDescription ? (
                  <p className="truncate text-xs text-gray-500">{challenge.shortDescription}</p>
                ) : null}
                <p className="mt-1 line-clamp-2 text-sm font-bold text-gray-800 group-hover:text-blue-500">
                  {challenge.title}
                </p>
              </div>
              {challenge.thumbnailUrl ? (
                <img
                  src={challenge.thumbnailUrl}
                  alt=""
                  className="aspect-[4/3] w-24 shrink-0 rounded-lg bg-gray-100 object-cover"
                />
              ) : (
                <div className="aspect-[4/3] w-24 shrink-0 rounded-lg bg-gray-100" />
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
