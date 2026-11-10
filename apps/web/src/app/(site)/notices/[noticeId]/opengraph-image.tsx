import {
  ogPostedText,
  POSTING_OG_SIZE,
  renderPostingOgImage,
} from '@/shared/lib/og/postingOgImage';
import { fetchNoticeDetail } from '@/widgets/notice-detail';

export const alt = '오늘의 공고 공지사항';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/**
 * 공지 상세를 공유했을 때 미리보기 카드. 상세 공고 카드(`shared/lib/og/postingOgImage.tsx`)
 * 모양에 공지 제목과 게시일만 싣는다 — 정보 칸이 없다. 고정 공지는 칩이 `고정 공지` 다.
 *
 * 이 화면의 `generateMetadata` 가 `openGraph` 를 통째로 내므로 루트의 기본 카드를 물려받지
 * 못한다. 그래서 자기 카드를 둔다.
 */
export default async function Image({ params }: { params: Promise<{ noticeId: string }> }) {
  const { noticeId } = await params;
  const notice = await fetchNoticeDetail(Number(noticeId));

  return renderPostingOgImage({
    theme: 'job',
    kindLabel: '공지사항',
    tags: [notice.pinned ? '고정 공지' : '공지'],
    title: notice.title,
    deadlineText: ogPostedText(notice.createdAt),
  });
}
