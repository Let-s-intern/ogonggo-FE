import type { Metadata } from 'next';
import { fetchBootcampDetail } from '@/widgets/bootcamp-detail';
import { BootcampDetailPage } from '@/views/bootcamp-detail';

type PageParams = { params: Promise<{ bootcampId: string }> };

/** 메타 설명 한 줄 분량. 초과하면 말줄임표를 붙인다. */
const DESCRIPTION_MAX_LENGTH = 150;

function buildDescription(companyName: string, title: string, shortDescription: string): string {
  const description = `${companyName} · ${title} — ${shortDescription}`;
  return description.length > DESCRIPTION_MAX_LENGTH
    ? `${description.slice(0, DESCRIPTION_MAX_LENGTH)}…`
    : description;
}

/**
 * `fetchBootcampDetail`(`widgets/bootcamp-detail/ui/BootcampDetailView.tsx`)을 그대로
 * 재사용한다 — 404 판별이 본문과 갈리면 안 된다. `getPublicBootcamp`는 `fetch`로 나가므로 같은
 * 렌더 안에서 본문과 이 호출이 자동으로 합쳐진다(요청 한 번).
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { bootcampId } = await params;
  const bootcamp = await fetchBootcampDetail(Number(bootcampId));

  const description = buildDescription(
    bootcamp.companyName,
    bootcamp.title,
    bootcamp.shortDescription,
  );
  const canonical = `/bootcamps/${bootcampId}`;

  return {
    title: bootcamp.title,
    description,
    alternates: { canonical },
    openGraph: {
      // 하위 화면의 `openGraph` 는 루트 것과 합쳐지지 않고 통째로 바뀐다. 사이트 이름과 형식을 다시
      // 적어야 공유 미리보기에 `오늘의 공고` 가 나온다. 이미지는 옆의 `opengraph-image.tsx` 가 만든다.
      type: 'website',
      siteName: '오늘의 공고',
      title: `[${bootcamp.companyName}] ${bootcamp.title} | 오늘의 공고`,
      description,
      url: canonical,
    },
  };
}

/**
 * 동적 라우트의 `params`는 이 Next 버전에서 Promise다 — `app/jobs/[jobId]/page.tsx`와 같다.
 * `bootcampId`가 숫자가 아니면 `NaN`이 되고, 그때도 존재하지 않는 id 조회와 같은 404로
 * 처리된다(`widgets/bootcamp-detail/ui/BootcampDetailView.tsx`).
 */
export default async function Page({ params }: PageParams) {
  const { bootcampId } = await params;

  return <BootcampDetailPage bootcampId={Number(bootcampId)} />;
}
