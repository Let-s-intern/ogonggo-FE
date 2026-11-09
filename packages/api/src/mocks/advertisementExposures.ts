import { http, HttpResponse, type HttpHandler } from 'msw';
import type { SuccessResponsePageResponseAdvertisementExposureResponse } from '../generated/user/models';
import { ListPublicAdvertisementExposuresPosition } from '../generated/user/models';
import {
  advertisementStore,
  isExposureShown,
  toPublicExposure,
} from './fixtures/advertisement-exposures';

const POSITIONS: readonly string[] = Object.values(ListPublicAdvertisementExposuresPosition);

/**
 * 자리별 공개 배너 조회(`GET /api/v1/advertisement-exposures?position=`, BE LC-3583). 그 자리의 상품 전부에서 지금 보이는
 * 노출(켜짐, 기간 안)만 `displayOrder`·`id` 순으로 준다. 자리를 빠뜨리거나 모르는 값이면 BE 처럼 400 이다.
 *
 * 웹 목 서버(`apps/web/src/instrumentation.ts`)는 이 핸들러를 서버가 뜰 때 한 번 등록한다. 시드를 고치면 웹 서버를
 * 다시 띄워야 보인다.
 */
const listPublicAdvertisementExposuresHandler = http.get(
  '*/api/v1/advertisement-exposures',
  ({ request }) => {
    const params = new URL(request.url).searchParams;
    const position = params.get('position');
    if (position === null || !POSITIONS.includes(position)) {
      return HttpResponse.json(
        { status: 400, code: 'BAD_REQUEST', message: 'position: 노출 자리를 보내 주세요.' },
        { status: 400 },
      );
    }
    const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
    const size = Math.min(100, Math.max(1, Number(params.get('size') ?? 10) || 10));
    const productIds = new Set(
      advertisementStore.products.filter((p) => p.position === position).map((p) => p.id),
    );
    const now = Date.now();
    const shown = advertisementStore.exposures
      .filter((e) => productIds.has(e.productId) && isExposureShown(e, now))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
    const body: SuccessResponsePageResponseAdvertisementExposureResponse = {
      status: 200,
      message: '요청이 성공했습니다.',
      data: {
        items: shown.slice((page - 1) * size, page * size).map(toPublicExposure),
        pageInfo: {
          pageNum: page,
          pageSize: size,
          totalElements: shown.length,
          totalPages: Math.ceil(shown.length / size),
        },
      },
    };
    return HttpResponse.json(body, { status: 200 });
  },
);

export const advertisementExposureHandlers: HttpHandler[] = [
  listPublicAdvertisementExposuresHandler,
];
