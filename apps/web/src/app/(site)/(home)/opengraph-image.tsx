import { renderSectionOgImage } from '@/shared/lib/og/sectionOgImage';
import { POSTING_OG_SIZE } from '@/shared/lib/og/postingOgImage';

export const alt = '오늘의 공고 채용공고';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/**
 * 채용공고(홈) 목록을 공유했을 때 미리보기 카드. 없으면 미리보기가 목록 첫 카드의 썸네일을 가져간다
 * (`shared/lib/og/sectionOgImage.tsx`).
 */
export default function Image() {
  return renderSectionOgImage('jobs');
}
