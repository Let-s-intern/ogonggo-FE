import { POSTING_OG_SIZE } from '@/shared/lib/og/postingOgImage';
import { renderSectionOgImage } from '@/shared/lib/og/sectionOgImage';

export const alt = '오늘의 공고 공고 달력';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/** 공고 달력을 공유했을 때 미리보기 카드(`shared/lib/og/sectionOgImage.tsx`). */
export default function Image() {
  return renderSectionOgImage('calendar');
}
