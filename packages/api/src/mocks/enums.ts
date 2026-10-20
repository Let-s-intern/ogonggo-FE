import { http, HttpResponse, type HttpHandler } from 'msw';
import { ENUM_CATALOG } from '../generated/enums';
import { ok } from './admin/paging';

/**
 * enum 카탈로그 목 핸들러. 응답은 codegen 스냅숏(`../generated/enums.ts`) 그대로다.
 *
 * 앱은 이 API 를 부르지 않고 스냅숏을 import 한다. 목은 직접 열어 볼 때와 orval 이 만든 faker
 * 핸들러(값이 무작위다)가 대신 받지 않게 하려고 둔다.
 *
 * 어드민 응답은 백엔드처럼 광고 문의 2개를 빼고 어드민 전용 2개를 더한다. 어드민 전용 라벨은
 * `ogonggo-BE/ogonggo-api-admin/src/main/kotlin/com/ogonggo/adminapi/content/business/AdminContentSortType.kt`,
 * `AdminContentVisibility.kt` 의 `desc` 를 옮겼다.
 */

const {
  AdvertisementInquiryType: _inquiryType,
  AdvertisementInquiryPromotionChannel: _promotionChannel,
  ...COMMON
} = ENUM_CATALOG;

const ADMIN_CATALOG = {
  ...COMMON,
  AdminContentSortType: [
    { name: 'REGISTERED_AT', desc: '등록일순', parent: null },
    { name: 'VIEW_COUNT', desc: '조회수순', parent: null },
  ],
  AdminContentVisibility: [
    { name: 'VISIBLE', desc: '노출', parent: null },
    { name: 'HIDDEN', desc: '비노출', parent: null },
  ],
};

export const enumHandlers: HttpHandler[] = [
  http.get('*/api/v1/enums', () => HttpResponse.json(ok(ENUM_CATALOG))),
  http.get('*/api/v1/admin/enums', () => HttpResponse.json(ok(ADMIN_CATALOG))),
];
