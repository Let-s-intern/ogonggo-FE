import {
  ogDeadlineText,
  POSTING_OG_SIZE,
  renderPostingOgImage,
} from '@/shared/lib/og/postingOgImage';
import { fetchSideStudyDetail } from '@/widgets/side-study-detail';

export const alt = '오늘의 공고 사이드·스터디';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/**
 * 사이드·스터디 모집글을 공유했을 때 미리보기 카드. 회사가 아니라 개인이 쓴 글이라 로고 자리는
 * 작성자 이름의 첫 글자다. 모양은 채용공고(`app/(site)/jobs/[jobId]/opengraph-image.tsx`)와 같다.
 */
export default async function Image({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const sideStudy = await fetchSideStudyDetail(Number(postId));
  return renderPostingOgImage({
    kindLabel: '사이드·스터디',
    organizationName: sideStudy.author.nickname ?? '익명',
    title: sideStudy.title,
    deadlineText: ogDeadlineText(sideStudy.recruitmentEndDate),
  });
}
