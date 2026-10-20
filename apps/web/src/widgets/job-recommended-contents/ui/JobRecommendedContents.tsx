import {
  enumLabels,
  listPublicJobRecommendedLetsCareerContents,
  type SuccessResponseListUserRecommendedLetsCareerContentResponse,
  type UserRecommendedLetsCareerContentResponse,
  type UserRecommendedLetsCareerContentResponseKind,
} from '@ogonggo/api';

/** 종류 글자. enum 카탈로그의 `LetsCareerContentKind` 다. */
const KIND_LABELS: Record<UserRecommendedLetsCareerContentResponseKind, string> =
  enumLabels('LetsCareerContentKind');

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

/** 채용공고 상세 페이지가 이 위젯에 넘기는 제목. 모달은 `함께 보면 좋아요` 를 넘긴다. */
export const JOB_PREPARATION_TITLE = '이 공고, 더 탄탄하게 준비하고 싶다면?';

export interface JobRecommendedContentsProps {
  jobId: number;
  /** 구역 제목. 페이지와 모달이 다르다. */
  title: string;
}

/**
 * 채용공고 상세의 렛츠커리어 추천 — 그 공고의 직군·직무와 요구 서류·전형으로 고른 프로그램·무료
 * 자료집·블로그 3개(`GET /api/v1/jobs/{jobId}/recommended-lets-career-contents`). 누르면 응답의
 * `url`(렛츠커리어 웹 상세)을 새 탭으로 연다. 주소를 여기서 만들지 않는다.
 *
 * 항목 모양은 교육·부트캠프 상세의 챌린지 추천(`widgets/cross-sell`)을 따른다. 왼쪽에 종류 글자
 * (파랑), 제목(굵게, 두 줄), 설명(회색, 두 줄, 없으면 줄 없음), 오른쪽에 4:3 썸네일이고 항목 사이에
 * 가는 선이 있다. 모집 기간은 그리지 않는다.
 *
 * 렛츠커리어 콘텐츠를 아직 받지 못해 빈 배열이 오거나 부르기에 실패하면 구역 전체를 그리지 않는다.
 */
export async function JobRecommendedContents({ jobId, title }: JobRecommendedContentsProps) {
  const contents = await fetchRecommendedContents(jobId);
  if (contents.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      <ul className="mt-1 divide-y divide-gray-100">
        {contents.map((content) => (
          // 식별자는 종류마다 따로 매긴다 — 종류와 묶어야 겹치지 않는다.
          <li key={`${content.kind}-${content.letsCareerContentId}`}>
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-blue-500">
                  {KIND_LABELS[content.kind]}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-bold text-gray-800 group-hover:text-blue-500">
                  {content.title}
                </p>
                {content.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">{content.description}</p>
                ) : null}
              </div>
              {content.thumbnailUrl ? (
                <img
                  src={content.thumbnailUrl}
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
