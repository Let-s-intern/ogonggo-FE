import { POSTING_OG_SIZE } from '@/shared/lib/og/postingOgImage';
import { renderSiteOgImage } from '@/shared/lib/og/siteOgImage';

export const alt = '오늘의 공고 공지사항';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/**
 * 공지 상세를 공유했을 때 미리보기 카드. 기본 카드(`shared/lib/og/siteOgImage.tsx`)와 같다.
 * 이 화면의 `generateMetadata` 가 `openGraph` 를 통째로 내므로 루트의 기본 카드를 물려받지
 * 못한다. 그래서 여기에 다시 둔다.
 */
export default function Image() {
  return renderSiteOgImage();
}
