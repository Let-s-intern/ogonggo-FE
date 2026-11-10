import { POSTING_OG_SIZE } from '@/shared/lib/og/postingOgImage';
import { renderSiteOgImage } from '@/shared/lib/og/siteOgImage';

export const alt = '오늘의 공고';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/** 자기 미리보기 카드가 없는 화면이 물려받는 기본 카드(`shared/lib/og/siteOgImage.tsx`). */
export default function Image() {
  return renderSiteOgImage();
}
