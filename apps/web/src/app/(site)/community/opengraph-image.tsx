import { renderSectionOgImage } from '@/shared/lib/og/sectionOgImage';
import { POSTING_OG_SIZE } from '@/shared/lib/og/postingOgImage';

export const alt = '오늘의 공고 커뮤니티';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/** 오공고 커뮤니티를 공유했을 때 미리보기 카드(`shared/lib/og/sectionOgImage.tsx`). */
export default function Image() {
  return renderSectionOgImage('community');
}
