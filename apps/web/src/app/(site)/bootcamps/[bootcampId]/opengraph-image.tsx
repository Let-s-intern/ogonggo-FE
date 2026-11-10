import { OPERATION_TYPE_LABELS, TUITION_TYPE_LABELS } from '@/entities/bootcamp/model/labels';
import { getCompanyLogoUrl } from '@/entities/job/model/company-logo';
import {
  type OgInfoCell,
  ogDeadlineText,
  ogShortDate,
  POSTING_OG_SIZE,
  renderPostingOgImage,
} from '@/shared/lib/og/postingOgImage';
import { fetchBootcampDetail } from '@/widgets/bootcamp-detail';

export const alt = '오늘의 공고 교육·부트캠프';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/**
 * 교육·부트캠프를 공유했을 때 미리보기 카드. `app/(site)/jobs/[jobId]/opengraph-image.tsx` 와 같다.
 *
 * 정보 칸은 교육 기간·수강료·진행 방식·정원이다. 정원은 선택 필드라 없으면 칸을 뺀다 — 생성
 * 타입은 `capacity?: number` 지만 백엔드는 `null` 을 보내므로 `== null` 로 거른다.
 */
export default async function Image({ params }: { params: Promise<{ bootcampId: string }> }) {
  const { bootcampId } = await params;
  const bootcamp = await fetchBootcampDetail(Number(bootcampId));
  const infoCells: OgInfoCell[] = [
    {
      label: '교육 기간',
      value: `${ogShortDate(bootcamp.programStartDate)} – ${ogShortDate(bootcamp.programEndDate)}`,
    },
    { label: '수강료', value: TUITION_TYPE_LABELS[bootcamp.tuitionType] },
    {
      label: '진행 방식',
      value: OPERATION_TYPE_LABELS[bootcamp.operationType],
    },
    ...(bootcamp.capacity == null ? [] : [{ label: '정원', value: `${bootcamp.capacity}명` }]),
  ];

  return renderPostingOgImage({
    theme: 'bootcamp',
    kindLabel: '교육·부트캠프',
    organizationName: bootcamp.companyName,
    title: bootcamp.title,
    // API 가 로고를 주지 않으면 상세 헤더(`CompanyLogo`)와 같은 회사명 목록에서 찾는다.
    logoUrl: bootcamp.logoUrl ?? getCompanyLogoUrl(bootcamp.companyName),
    coverUrl: bootcamp.representativeImageUrl,
    infoCells,
    deadlineText: ogDeadlineText(
      'bootcamp',
      bootcamp.recruitmentEndAt,
      bootcamp.recruitmentType === 'ALWAYS_OPEN',
    ),
  });
}
