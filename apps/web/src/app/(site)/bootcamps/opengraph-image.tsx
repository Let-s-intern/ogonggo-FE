import { renderSectionOgImage } from '@/shared/lib/og/sectionOgImage';
import { POSTING_OG_SIZE } from '@/shared/lib/og/postingOgImage';

export const alt = '오늘의 공고 교육·부트캠프';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/**
 * 교육·부트캠프 목록을 공유했을 때 미리보기 카드. 없으면 미리보기가 목록 첫 카드의 썸네일을 가져간다
 * (`shared/lib/og/sectionOgImage.tsx`). 상세(`[bootcampId]`)는 자기
 * 카드가 따로 있다.
 */
export default function Image() {
  return renderSectionOgImage('bootcamps');
}
