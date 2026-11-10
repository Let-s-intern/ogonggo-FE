import { renderSectionOgImage } from '@/shared/lib/og/sectionOgImage';
import { POSTING_OG_SIZE } from '@/shared/lib/og/postingOgImage';

export const alt = '오늘의 공고 취준 고민';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/**
 * 취준 고민 목록을 공유했을 때 미리보기 카드(`shared/lib/og/sectionOgImage.tsx`). 상세
 * (`[concernId]/opengraph-image.tsx`)도 같은 카드를 그린다.
 */
export default function Image() {
  return renderSectionOgImage('concerns');
}
