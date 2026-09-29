import { getCompanyLogoUrl } from '@/entities/job/model/company-logo';
import {
  ogDeadlineText,
  POSTING_OG_SIZE,
  renderPostingOgImage,
} from '@/shared/lib/og/postingOgImage';
import { fetchJobDetail } from '@/widgets/job-detail';

export const alt = '오늘의 공고 채용공고';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/**
 * 채용공고를 공유했을 때 미리보기 카드. 모양은 `shared/lib/og/postingOgImage.tsx` 가 정한다.
 * 파일로 둔 이미지는 `generateMetadata` 의 `openGraph.images` 보다 우선한다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md).
 */
export default async function Image({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await fetchJobDetail(Number(jobId));
  return renderPostingOgImage({
    kindLabel: '채용공고',
    organizationName: job.companyName,
    title: job.title,
    // API 가 로고를 주지 않으면 상세 헤더(`CompanyLogo`)와 같은 회사명 목록에서 찾는다.
    logoUrl: job.logoUrl ?? getCompanyLogoUrl(job.companyName),
    deadlineText: ogDeadlineText(job.recruitmentEndAt, job.recruitmentType === 'ALWAYS_OPEN'),
  });
}
