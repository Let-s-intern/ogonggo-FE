import { POSTING_OG_SIZE } from '@/shared/lib/og/postingOgImage';
import { renderSectionOgImage } from '@/shared/lib/og/sectionOgImage';

export const alt = '오늘의 공고 취준 고민';
export const size = POSTING_OG_SIZE;
export const contentType = 'image/png';

/**
 * 취준 고민 상세를 공유했을 때 미리보기 카드. 목록 카드(`concerns/opengraph-image.tsx`)와 같다.
 * 이 화면의 `generateMetadata` 가 `openGraph` 를 통째로 내므로 목록 카드를 물려받지 못한다.
 */
export default function Image() {
  return renderSectionOgImage('concerns');
}
