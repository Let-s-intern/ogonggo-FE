import { fetchBanners } from '../api/fetchBanners';
import { BannerCarousel } from './BannerCarousel';

/**
 * 상세 사이드바의 배너 자리(`JOB_DETAIL_SIDE` 공고 상세, `BOOTCAMP_DETAIL_SIDE` 부트캠프 상세, 이슈 #573). 홈 배너 자리(`HomeBannerSlot`)와 같은 모델·어드민
 * (`배너 세팅` 의 `공고 상세` 탭)을 쓰고 모양만 세로다. PC 는 사이드바 폭에 400×500, 사이드바가 본문 아래로 내려가는
 * lg 미만은 750×200 소재다. 노출 중인 배너가 없으면 아무것도 그리지 않는다.
 */
export async function SideBannerSlot({
  placement = 'JOB_DETAIL_SIDE',
}: {
  placement?: 'JOB_DETAIL_SIDE' | 'BOOTCAMP_DETAIL_SIDE';
}) {
  const banners = await fetchBanners(placement);
  if (banners.length === 0) {
    return null;
  }
  return <BannerCarousel banners={banners} placement={placement} variant="side" />;
}
