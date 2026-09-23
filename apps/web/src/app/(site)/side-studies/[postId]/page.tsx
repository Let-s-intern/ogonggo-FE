import type { Metadata } from 'next';
import { fetchSideStudyDetail } from '@/widgets/side-study-detail';
import { SideStudyDetailPage } from '@/views/side-study-detail';

type PageParams = { params: Promise<{ postId: string }> };

/** 메타 설명 한 줄 분량. 초과하면 말줄임표를 붙인다. */
const DESCRIPTION_MAX_LENGTH = 150;

function buildDescription(title: string, summary: string): string {
  const description = `${title}. ${summary}`;
  return description.length > DESCRIPTION_MAX_LENGTH
    ? `${description.slice(0, DESCRIPTION_MAX_LENGTH)}…`
    : description;
}

/**
 * `fetchSideStudyDetail`(`widgets/side-study-detail/ui/SideStudyDetailView.tsx`)을 그대로
 * 재사용한다 — `postId`가 1 미만이거나 정수가 아니면 부르지 않고 바로 `notFound()`로 보내는
 * 판별과 404 판별이 본문과 갈리면 안 된다. `getPublicRecruitmentPost`는 `fetch`로 나가므로 같은
 * 렌더 안에서 본문과 이 호출이 자동으로 합쳐진다(요청 한 번).
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { postId } = await params;
  const sideStudy = await fetchSideStudyDetail(Number(postId));

  const description = buildDescription(sideStudy.title, sideStudy.summary);
  const canonical = `/side-studies/${postId}`;

  return {
    title: sideStudy.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: sideStudy.title,
      description,
      url: canonical,
    },
  };
}

/**
 * 동적 라우트의 `params`는 이 Next 버전에서 Promise다 — `app/bootcamps/[bootcampId]/page.tsx`와
 * 같다. `postId`가 숫자가 아니면 `NaN`이 되고, 그때도 존재하지 않는 id 조회와 같은 404로
 * 처리된다(`widgets/side-study-detail/ui/SideStudyDetailView.tsx`).
 */
export default async function Page({ params }: PageParams) {
  const { postId } = await params;

  return <SideStudyDetailPage postId={Number(postId)} />;
}
