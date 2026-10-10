import type { Metadata } from 'next';
import { fetchConcernDetail } from '@/widgets/concern-detail';
import { ConcernDetailPage } from '@/views/concern-detail';

type PageParams = { params: Promise<{ concernId: string }> };

/** 메타 설명 한 줄 분량. 초과하면 말줄임표를 붙인다. */
const DESCRIPTION_MAX_LENGTH = 150;

/** 본문은 줄바꿈이 많은 일반 텍스트라 공백으로 접어 한 줄로 만든다. */
function buildDescription(content: string): string {
  const description = content.replace(/\s+/g, ' ').trim();
  return description.length > DESCRIPTION_MAX_LENGTH
    ? `${description.slice(0, DESCRIPTION_MAX_LENGTH)}…`
    : description;
}

/**
 * `fetchConcernDetail`(`widgets/concern-detail/ui/ConcernDetailView.tsx`) 을 그대로 쓴다 — id 판별과
 * 404 판별이 본문과 갈리면 안 된다. 상세 요청은 조회수를 올리는데, `fetch` 라 같은 렌더 안에서 본문과
 * 이 호출이 하나로 합쳐진다(요청 한 번).
 *
 * 공유 미리보기 이미지(`opengraph-image.tsx`)는 두지 않는다(PRD "하지 않는 것"). 하위 화면의
 * `openGraph` 는 루트 것과 합쳐지지 않고 통째로 바뀌므로 사이트 이름과 형식을 다시 적는다.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { concernId } = await params;
  const concern = await fetchConcernDetail(Number(concernId));

  const description = buildDescription(concern.content);
  const canonical = `/concerns/${concernId}`;

  return {
    title: concern.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: '오늘의 공고',
      title: `${concern.title} | 오늘의 공고`,
      description,
      url: canonical,
    },
  };
}

/**
 * 동적 라우트의 `params` 는 이 Next 버전에서 Promise 다. `concernId` 가 숫자가 아니면 `NaN` 이 되고,
 * 그때도 없는 id 와 같은 404 로 처리된다(`fetchConcernDetail`).
 */
export default async function Page({ params }: PageParams) {
  const { concernId } = await params;

  return <ConcernDetailPage concernId={Number(concernId)} />;
}
