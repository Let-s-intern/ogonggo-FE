import type { Metadata } from 'next';
import { fetchJobDetail } from '@/widgets/job-detail';
import { formatDateDots } from '@/shared/lib/localDate';
import { JobDetailPage } from '@/views/job-detail';

type PageParams = { params: Promise<{ jobId: string }> };

/** 헤더 카드(`JobDetailHeaderCard.tsx`)의 마감 문구보다 짧게 — 메타 설명 한 줄에 들어갈 분량이다. */
function formatDeadlineForDescription(recruitmentType: string, recruitmentEndAt?: string): string {
  if (recruitmentType === 'ALWAYS_OPEN') {
    return '상시채용';
  }
  return recruitmentEndAt ? `${formatDateDots(recruitmentEndAt)} 마감` : '마감일 미정';
}

/**
 * `fetchJobDetail`(`widgets/job-detail/ui/JobDetailView.tsx`)을 그대로 재사용한다 — 404 판별
 * 규칙(HttpError 404 → `notFound()`, 그 외 재던짐)이 화면 본문과 갈리면 한쪽만 404 처리되는
 * 화면이 생긴다. `getPublicJob`은 `fetch`로 나가므로 같은 렌더 안에서 본문과 이 호출이
 * 자동으로 합쳐진다(요청 한 번, `generate-metadata.md` "memoized").
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { jobId } = await params;
  const job = await fetchJobDetail(Number(jobId));

  const description = `${job.companyName}에서 채용 중인 ${job.title}. ${formatDeadlineForDescription(job.recruitmentType, job.recruitmentEndAt)}`;
  const canonical = `/jobs/${jobId}`;

  return {
    title: job.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: job.title,
      description,
      url: canonical,
      images: job.coverImageUrl ? [job.coverImageUrl] : undefined,
    },
  };
}

/**
 * 이 Next 버전에서 동적 라우트의 `params`는 Promise로 온다 — 동기 접근은 더 이상 없음
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md).
 * `jobId`가 숫자가 아니면 `NaN`이 되고, `getPublicJob(NaN)`은 존재하지 않는 id 조회와 같은 404로
 * 처리된다 (widgets/job-detail/ui/JobDetailView.tsx) — 별도 검증이 필요 없다.
 */
export default async function Page({ params }: PageParams) {
  const { jobId } = await params;

  return <JobDetailPage jobId={Number(jobId)} />;
}
