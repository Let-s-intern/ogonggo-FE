import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminAdvertisementExposureResponse,
  UpdateAdminAdvertisementExposureRequest,
} from '../../generated/admin/models';
import {
  advertisementStore,
  saveAdvertisementStore,
  type ProductRecord,
} from '../fixtures/advertisement-exposures';
import { findContent } from './advertisementReports';
import { ok, paginate, readPaging } from './paging';

/**
 * 광고 공고(카드) 노출 목(PRD `prd-business-report.md` 6.8, API 계약 2절). BE(Push 5) 배포 전이라 이 모양이 계약이다.
 *
 * - 자리 enum 에 `JOB_LIST`·`BOOTCAMP_LIST`·`JOB_DETAIL_SIDE` 가 더해진다(D12). 자리마다 광고 공고 상품 하나를 시드로 넣는다
 * - 어드민 노출 응답에 `targetTitle`·`targetCompanyName`·`targetPublished` 가 더해진다. 노출 목록을 여기서 먼저 받아 얹는다
 * - 같은 자리(상품) 안 같은 대상은 409. 없는 대상은 404. 나머지 검증·저장은 `./advertisements.ts` 가 그대로 한다
 *
 * `./handlers.ts` 에서 `advertisementAdminHandlers` 보다 앞에 둔다.
 */

const EXPOSURES = '*/api/v1/admin/advertisement-exposures';

export type AdPostingPosition = 'JOB_LIST' | 'BOOTCAMP_LIST' | 'JOB_DETAIL_SIDE';

/** 어드민 노출 응답에 이 목이 얹는 칸. 배너는 모두 null 이다. */
export type AdminAdPostingExposureResponse = AdminAdvertisementExposureResponse & {
  targetTitle: string | null;
  targetCompanyName: string | null;
  targetPublished: boolean | null;
};

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ status, code, message }, { status });
}

const SEED_TIME = '2026-11-06T09:00:00';

const POSTING_PRODUCTS: { id: number; position: AdPostingPosition; name: string; price: number }[] =
  [
    { id: 101, position: 'JOB_LIST', name: '채용공고 목록 광고 공고', price: 200000 },
    { id: 102, position: 'BOOTCAMP_LIST', name: '부트캠프 목록 광고 공고', price: 200000 },
    { id: 103, position: 'JOB_DETAIL_SIDE', name: '공고 상세 추천 광고 공고', price: 150000 },
  ];

/**
 * 시드. 저장소를 `./advertisements.ts` 와 같이 쓰고 `localStorage` 에 남으므로 없을 때만 넣는다. 채용공고 목록 자리에는
 * 새싹컴퍼니 계약(1번)에 걸린 광고 하나와 자체 홍보 하나, 부트캠프 목록 자리에는 하나를 건다. 계약 1번에는 이 자리 상품을
 * 붙여 광고 카드 상품의 리포트도 볼 수 있게 한다.
 */
function seedPostings() {
  for (const product of POSTING_PRODUCTS) {
    if (advertisementStore.products.some((item) => item.id === product.id)) continue;
    advertisementStore.products.push({
      ...product,
      // 생성 타입의 자리 enum 에는 아직 새 자리가 없다(코드젠 전).
      position: product.position as unknown as ProductRecord['position'],
      category: 'JOB_POSTING',
      registeredAt: SEED_TIME,
      updatedAt: SEED_TIME,
      deletedAt: null,
    });
  }
  if (!advertisementStore.exposures.some((exposure) => exposure.productId === 101)) {
    const base = {
      name: null,
      imageUrl: null,
      linkUrl: null,
      adLabel: true,
      exposed: true,
      advertiserCompanyName: null,
      registeredAt: SEED_TIME,
      updatedAt: SEED_TIME,
    };
    const nextId = Math.max(0, ...advertisementStore.exposures.map((item) => item.id)) + 1;
    advertisementStore.exposures.push(
      {
        ...base,
        id: nextId,
        productId: 101,
        contractId: 1,
        targetType: 'JOB',
        targetId: 1,
        startAt: '2026-11-12T00:00:00',
        endAt: '2026-11-30T23:59:59',
        displayOrder: 1,
      },
      {
        ...base,
        id: nextId + 1,
        productId: 101,
        contractId: null,
        targetType: 'JOB',
        targetId: 2,
        adLabel: false,
        startAt: null,
        endAt: null,
        displayOrder: 2,
      },
      {
        ...base,
        id: nextId + 2,
        productId: 102,
        contractId: null,
        targetType: 'BOOTCAMP',
        targetId: 3,
        startAt: null,
        endAt: null,
        displayOrder: 1,
      },
    );
  }
  const contract = advertisementStore.contracts.find((item) => item.id === 1);
  const cpId = 902;
  if (
    contract &&
    !advertisementStore.contracts.some((item) =>
      item.products.some((cp) => cp.contractProductId === cpId),
    )
  ) {
    contract.products.push({
      contractProductId: cpId,
      productId: 101,
      productName: '채용공고 목록 광고 공고',
      category: 'JOB_POSTING',
      productDeleted: false,
      startDate: '2026-11-12',
      endDate: '2026-11-30',
      addedAt: SEED_TIME,
    });
  }
  saveAdvertisementStore();
}

seedPostings();

function withTarget(exposure: AdminAdvertisementExposureResponse): AdminAdPostingExposureResponse {
  const contract = advertisementStore.contracts.find((item) => item.id === exposure.contractId);
  const content =
    exposure.targetType && exposure.targetId != null
      ? findContent(exposure.targetType, exposure.targetId)
      : undefined;
  return {
    ...exposure,
    advertiserCompanyName: contract?.companyName ?? null,
    targetTitle: content?.title ?? null,
    targetCompanyName: content?.companyName ?? null,
    targetPublished: content ? content.published : null,
  };
}

/** `./advertisements.ts` 의 목록과 같다. 대상 칸만 더한다. */
const listExposuresHandler = http.get(EXPOSURES, ({ request }) => {
  const url = new URL(request.url);
  const productId = Number(url.searchParams.get('productId'));
  if (!Number.isInteger(productId) || productId < 1) {
    return error(400, 'BAD_REQUEST', 'productId: 상품 id 를 보내 주세요.');
  }
  const contractParam = url.searchParams.get('contractId');
  const contractId = contractParam === null ? null : Number(contractParam);
  const { page, size } = readPaging(url);
  const rows = advertisementStore.exposures
    .filter((exposure) => exposure.productId === productId)
    .filter((exposure) => contractId === null || exposure.contractId === contractId)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
    .map(withTarget);
  return HttpResponse.json(ok(paginate(rows, page, size)), { status: 200 });
});

/** 광고 공고 상품의 대상만 본다. 문제가 없으면 아무것도 돌려주지 않아 다음 핸들러가 받는다. */
function targetError(
  productId: number,
  body: UpdateAdminAdvertisementExposureRequest,
  selfId?: number,
) {
  const product = advertisementStore.products.find((item) => item.id === productId);
  if (product?.category !== 'JOB_POSTING' || !body.targetType || body.targetId == null) {
    return undefined;
  }
  if (!findContent(body.targetType, body.targetId)) {
    return error(404, 'ADVERTISEMENT_EXPOSURE_TARGET_NOT_FOUND', '광고할 공고를 찾을 수 없습니다.');
  }
  const duplicated = advertisementStore.exposures.some(
    (exposure) =>
      exposure.id !== selfId &&
      exposure.productId === productId &&
      exposure.targetType === body.targetType &&
      exposure.targetId === body.targetId,
  );
  return duplicated
    ? error(
        409,
        'ADVERTISEMENT_EXPOSURE_TARGET_DUPLICATED',
        '이 자리에 이미 같은 공고의 광고가 있습니다.',
      )
    : undefined;
}

const createGuardHandler = http.post(EXPOSURES, async ({ request }) => {
  const body = (await request
    .clone()
    .json()
    .catch(() => null)) as
    | (UpdateAdminAdvertisementExposureRequest & { productId?: number })
    | null;
  if (!body || typeof body.productId !== 'number') return undefined;
  return targetError(body.productId, body);
});

const replaceGuardHandler = http.put(`${EXPOSURES}/:exposureId`, async ({ params, request }) => {
  const exposure = advertisementStore.exposures.find(
    (item) => item.id === Number(params.exposureId),
  );
  const body = (await request
    .clone()
    .json()
    .catch(() => null)) as UpdateAdminAdvertisementExposureRequest | null;
  if (!exposure || !body) return undefined;
  return targetError(exposure.productId, body, exposure.id);
});

export const advertisementPostingHandlers: HttpHandler[] = [
  listExposuresHandler,
  createGuardHandler,
  replaceGuardHandler,
];
