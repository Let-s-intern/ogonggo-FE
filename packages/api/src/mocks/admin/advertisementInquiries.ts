import { http, HttpResponse, type HttpHandler } from 'msw';
import { ok } from './paging';

/**
 * 광고 문의 오늘 건수 핸들러(`GET /api/v1/admin/advertisement-inquiries/today-count`).
 *
 * 어드민 사이드바 배지가 화면을 열자마자 부르는 요청이다. 핸들러가 없으면 MSW 가 그대로 통과시키고(`onUnhandledRequest: 'warn'`),
 * 프리뷰 배포에서는 rewrite 로 실제 어드민 API 까지 가서 401 을 받는다. 목 모드의 로그인은 가짜라 그 401 이 곧바로 로그인
 * 화면 이동으로 이어진다. 배지에 숫자가 보이도록 0 이 아닌 값을 준다.
 */

export const advertisementInquiryHandlers: HttpHandler[] = [
  http.get('*/api/v1/admin/advertisement-inquiries/today-count', () =>
    HttpResponse.json(ok({ count: 3 })),
  ),
];
