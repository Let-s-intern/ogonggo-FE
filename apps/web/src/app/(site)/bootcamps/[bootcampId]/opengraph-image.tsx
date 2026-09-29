import { getCompanyLogoUrl } from '@/entities/job/model/company-logo';
import {
  ogDeadlineText,
  POSTING_OG_SIZE,
  renderPostingOgImage,
} from '@/shared/lib/og/postingOgImage';
import { fetchBootcampDetail } from '@/widgets/bootcamp-detail';

export const alt = '오늘의 공고 교육·부트캠프';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/** 교육·부트캠프를 공유했을 때 미리보기 카드. `app/(site)/jobs/[jobId]/opengraph-image.tsx` 와 같다. */
export default async function Image({ params }: { params: Promise<{ bootcampId: string }> }) {
  const { bootcampId } = await params;
  const bootcamp = await fetchBootcampDetail(Number(bootcampId));
  return renderPostingOgImage({
    kindLabel: '교육·부트캠프',
    organizationName: bootcamp.companyName,
    title: bootcamp.title,
    // API 가 로고를 주지 않으면 상세 헤더(`CompanyLogo`)와 같은 회사명 목록에서 찾는다.
    logoUrl: bootcamp.logoUrl ?? getCompanyLogoUrl(bootcamp.companyName),
    deadlineText: ogDeadlineText(
      bootcamp.recruitmentEndAt,
      bootcamp.recruitmentType === 'ALWAYS_OPEN',
    ),
  });
}
