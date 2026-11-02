import {
  enumLabels,
  type UserRecommendedChallengeResponse,
  type UserRecommendedLetsCareerContentResponse,
  type UserRecommendedLetsCareerContentResponseKind,
} from '@ogonggo/api';
import { letsCareerChallengeUrl } from '@/shared/api/letsCareerHandoff';

/** 추천 카드 하나. 종류 머리의 아이콘은 자료집만 폴더이고 나머지는 렛츠커리어 마크다. */
export interface RecommendItem {
  id: string;
  icon: 'folder' | 'lets-career';
  label: string;
  title: string;
  description?: string;
  href: string;
}

const KIND_LABELS: Record<UserRecommendedLetsCareerContentResponseKind, string> =
  enumLabels('LetsCareerContentKind');

/** 시안의 카드 순서. 백엔드는 점수순으로 주므로 공고마다 순서가 달라 여기서 맞춘다. */
const KIND_ORDER: Partial<Record<UserRecommendedLetsCareerContentResponseKind, number>> = {
  MATERIAL: 0,
  BLOG: 1,
};
const PROGRAM_ORDER = 2;

function orderOf({ kind }: UserRecommendedLetsCareerContentResponse): number {
  return KIND_ORDER[kind] ?? PROGRAM_ORDER;
}

/**
 * 무료 자료집의 설명은 렛츠커리어가 설명 칸에 JSON 을 저장해서 `{"metaDescription":"…", …}` 원문으로
 * 온다(운영 응답 실측, 자료집 21건 모두). 그중 `metaDescription` 만 쓴다. JSON 인데 읽지 못하면
 * 원문을 보이느니 설명 없는 카드로 둔다.
 */
export function readableDescription(description?: string | null): string | undefined {
  if (!description) {
    return undefined;
  }
  if (!description.trimStart().startsWith('{')) {
    return description;
  }
  try {
    const parsed: unknown = JSON.parse(description);
    const meta = (parsed as { metaDescription?: unknown } | null)?.metaDescription;
    return typeof meta === 'string' && meta.trim() ? meta : undefined;
  } catch {
    return undefined;
  }
}

function labelOf(kind: UserRecommendedLetsCareerContentResponseKind): string {
  const label = KIND_LABELS[kind];
  return kind === 'MATERIAL' || kind === 'BLOG' ? label : `렛츠커리어 ${label}`;
}

export function toContentItems(
  contents: UserRecommendedLetsCareerContentResponse[],
): RecommendItem[] {
  return [...contents]
    .sort((a, b) => orderOf(a) - orderOf(b))
    .map((content) => ({
      // 식별자는 종류마다 따로 매긴다 — 종류와 묶어야 겹치지 않는다.
      id: `${content.kind}-${content.letsCareerContentId}`,
      icon: content.kind === 'MATERIAL' ? 'folder' : 'lets-career',
      label: labelOf(content.kind),
      title: content.title,
      description: readableDescription(content.description),
      href: content.url,
    }));
}

export function toChallengeItems(challenges: UserRecommendedChallengeResponse[]): RecommendItem[] {
  return challenges.map((challenge) => ({
    id: `CHALLENGE-${challenge.challengeId}`,
    icon: 'lets-career',
    label: labelOf('CHALLENGE'),
    title: challenge.title,
    description: challenge.shortDescription,
    href: letsCareerChallengeUrl(challenge.challengeId),
  }));
}
