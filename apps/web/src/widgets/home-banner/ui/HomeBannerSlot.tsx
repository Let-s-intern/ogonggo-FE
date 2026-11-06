import type { BannerPlacement } from '@ogonggo/api';
import { fetchBanners } from '../api/fetchBanners';
import { BannerCarousel } from './BannerCarousel';

/**
 * 홈의 배너 자리(광고 구좌 시안 `home-pc-guest.png`, 이슈 #573). `HOME_TOP` 은 히어로 아래, `HOME_BOTTOM` 은
 * 목록 아래 `FOR BUSINESS` 배너 위다.
 *
 * 서버에서 받아 처음 HTML 에 넣는다 — 브라우저에서 받으면 배너가 늦게 끼어들며 아래 목록을 밀어낸다.
 * 노출 중인 배너가 없으면 아무것도 그리지 않는다. 빈 회색 상자를 두지 않는다(2026-09-30, 사용자).
 */
export async function HomeBannerSlot({ placement }: { placement: BannerPlacement }) {
  const banners = await fetchBanners(placement);
  if (banners.length === 0) {
    return null;
  }
  return <BannerCarousel banners={banners} placement={placement} />;
}
