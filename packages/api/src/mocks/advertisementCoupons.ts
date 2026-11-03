import { http, HttpResponse, type HttpHandler } from 'msw';
import { AD_COUPON_FIXTURES } from './fixtures/advertisement';

/**
 * 내 광고 쿠폰 목(`GET /api/v1/users/me/advertisement-coupons`). 비즈니스 앱의 신청 가능 일정·광고 목록이 무료 쿠폰
 * 사용 가능 여부를 그린다. 경로·응답은 요청서 `.claude/tasks/memos/백엔드-요청-광고-시스템-business.md` 에 적었다.
 *
 * `/api/v1/users/me/advertisements/:advertisementId` 와 겹치지 않게 `advertisements` 아래가 아닌 이름을 쓴다.
 * 픽스처를 그대로 돌려준다. 신청 생성이 쿠폰을 쓰는 상태(`./advertisements.ts`)와는 이어지지 않는다 — 픽스처 쿠폰은
 * 이미 쓴 상태라 둘이 어긋나지 않는다.
 */
export const advertisementCouponHandlers: HttpHandler[] = [
  http.get('*/api/v1/users/me/advertisement-coupons', () =>
    HttpResponse.json({ status: 200, message: '요청이 성공했습니다.', data: AD_COUPON_FIXTURES }),
  ),
];
