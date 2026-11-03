import { http, HttpResponse, type HttpHandler } from 'msw';
import { AD_COUPON_FIXTURES } from './fixtures/advertisement';
import type { AdCoupon } from './fixtures/advertisement-types';

/**
 * 내 광고 쿠폰 목(`GET /api/v1/users/me/advertisement-coupons`). 비즈니스 앱의 신청 가능 일정·광고 목록이 무료 쿠폰
 * 사용 가능 여부를 그린다. 경로·응답은 요청서 `.claude/tasks/memos/백엔드-요청-광고-시스템-business.md` 에 적었다.
 *
 * `/api/v1/users/me/advertisements/:advertisementId` 와 겹치지 않게 `advertisements` 아래가 아닌 이름을 쓴다.
 * 쿠폰 상태는 `./advertisements.ts` 가 브라우저 `localStorage` 에 남긴 것을 읽는다. 신청에서 쿠폰을 쓰면 여기서도 쓴 것으로
 * 나온다. 남긴 것이 없으면(처음, 또는 서버) 픽스처다.
 */
function currentCoupons(): AdCoupon[] {
  try {
    const raw =
      typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem('ogonggo.mock.advertisements');
    const stored = raw ? (JSON.parse(raw) as { coupons?: AdCoupon[] }) : undefined;
    return stored?.coupons ?? AD_COUPON_FIXTURES;
  } catch {
    return AD_COUPON_FIXTURES;
  }
}

export const advertisementCouponHandlers: HttpHandler[] = [
  http.get('*/api/v1/users/me/advertisement-coupons', () =>
    HttpResponse.json({ status: 200, message: '요청이 성공했습니다.', data: currentCoupons() }),
  ),
];
