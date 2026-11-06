import { http, HttpResponse, type HttpHandler } from 'msw';
import type { BannerPlacement, PublicBannerListResponse } from '../banners';
import { bannerStore, isBannerLive, toPublicBanner } from './fixtures/banners';

const PLACEMENTS: readonly string[] = ['HOME_TOP', 'HOME_BOTTOM'] satisfies BannerPlacement[];

/**
 * 홈 배너 공개 조회(`GET /api/v1/banners?placement=`). 지금 노출 중인 것(켜짐, 기간 안)만 자리 안 순서대로 준다.
 * 자리를 빠뜨리거나 모르는 값이면 백엔드에 바랄 동작대로 400 이다.
 *
 * 웹 목 서버(`apps/web/src/instrumentation.ts`)는 이 핸들러를 서버가 뜰 때 한 번 등록한다. 핸들러나 시드를 고치면
 * 웹 서버를 다시 띄워야 보인다.
 */
const listBannersHandler = http.get('*/api/v1/banners', ({ request }) => {
  const placement = new URL(request.url).searchParams.get('placement');
  if (placement === null || !PLACEMENTS.includes(placement)) {
    return HttpResponse.json(
      {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'placement: HOME_TOP, HOME_BOTTOM 중 하나를 보내 주세요.',
      },
      { status: 400 },
    );
  }
  const now = Date.now();
  const body: PublicBannerListResponse = {
    status: 200,
    message: '요청이 성공했습니다.',
    data: bannerStore.banners
      .filter((banner) => banner.placement === placement && isBannerLive(banner, now))
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(toPublicBanner),
  };
  return HttpResponse.json(body, { status: 200 });
});

export const bannerHandlers: HttpHandler[] = [listBannersHandler];
