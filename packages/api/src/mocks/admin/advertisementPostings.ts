import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminAdvertisementExposureResponse,
  AdminJobSummaryResponseJobField,
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
 * 광고 공고 노출 목. 현재 BE의 자리·직군 계약에 맞춰 관리자 설정 응답을 보완한다.
 *
 * - 광고 공고 자리와 직군(`jobField`)은 현재 BE enum·요청 계약을 따른다.
 * - 어드민 노출 응답에 `targetTitle`·`targetCompanyName`·`targetPublished` 가 더해진다. 노출 목록을 여기서 먼저 받아 얹는다
 * - 같은 자리(상품) 안 같은 대상은 409. 없는 대상은 404. 나머지 검증·저장은 `./advertisements.ts` 가 그대로 한다
 *
 * `./handlers.ts` 에서 `advertisementAdminHandlers` 보다 앞에 둔다.
 */

const EXPOSURES = '*/api/v1/admin/advertisement-exposures';

export type AdPostingPosition =
  | 'JOB_PICK'
  | 'JOB_LIST'
  | 'JOB_DETAIL_SIDE'
  | 'CALENDAR_DAY'
  | 'MYPAGE_SCRAP';

/** 어드민 노출 응답에 이 목이 얹는 칸. 배너는 모두 null 이다. */
export type AdminAdPostingExposureResponse = AdminAdvertisementExposureResponse & {
  jobField: AdminJobSummaryResponseJobField | null;
  targetTitle: string | null;
  targetCompanyName: string | null;
  targetPublished: boolean | null;
};

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ status, code, message }, { status });
}

const SEED_TIME = '2026-11-06T09:00:00';

const POSTING_PRODUCTS: { id: number; position: AdPostingPosition; name: string; price: number }[] = [
  { id: 101, position: 'JOB_LIST', name: '채용공고 목록 광고 공고', price: 200000 },
  { id: 103, position: 'JOB_DETAIL_SIDE', name: '공고 상세 추천 광고 공고', price: 150000 },
];

/**
 * 시드. 저장소를 `./advertisements.ts` 와 같이 쓰고 `localStorage` 에 남으므로 없을 때만 넣는다.
 * 채용공고 목록 자리의 노출은 직군 탭을 지정한다. 계약 1번에는 이 자리 상품을 붙여 광고 카드 상품의 리포트도 볼 수 있게 한다.
 */
function seedPostings() {
  for (const product of POSTING_PRODUCTS) {
    if (advertisementStore.products.some((item) => item.id === product.id)) continue;
    advertisementStore.products.push({
      ...product,
      // 생성 enum 은 BE 배포 전에 만든 스냅숏이라 새 자리는 문자열로 저장한다.
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
        jobField: 'IT_DEVELOPMENT',
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
        jobField: 'IT_DEVELOPMENT',
        targetType: 'JOB',
        targetId: 2,
        adLabel: false,
        startAt: null,
        endAt: null,
        displayOrder: 2,
      },
    );
  }
  // 계약 1번 광고 카드 상품에 광고 공고를 둘 건다. 리포트 `광고물별 성과` 표는 소재가 둘 이상일 때만 보인다.
  if (
    !advertisementStore.exposures.some(
      (exposure) =>
        exposure.productId === 101 && exposure.contractId === 1 && exposure.targetId === 3,
    )
  ) {
    const siblings = advertisementStore.exposures.filter((exposure) => exposure.productId === 101);
    advertisementStore.exposures.push({
      id: Math.max(0, ...advertisementStore.exposures.map((item) => item.id)) + 1,
      productId: 101,
      contractId: 1,
      jobField: 'IT_DEVELOPMENT',
      name: null,
      imageUrl: null,
      linkUrl: null,
      targetType: 'JOB',
      targetId: 3,
      adLabel: true,
      exposed: true,
      advertiserCompanyName: null,
      startAt: '2026-11-15T00:00:00',
      endAt: '2026-11-30T23:59:59',
      displayOrder: siblings.length + 1,
      registeredAt: SEED_TIME,
      updatedAt: SEED_TIME,
    });
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
    jobField: (exposure as AdminAdvertisementExposureResponse & {
      jobField?: AdminJobSummaryResponseJobField | null;
    }).jobField ?? null,
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
  body: UpdateAdminAdvertisementExposureRequest & {
    jobField?: AdminJobSummaryResponseJobField | null;
  },
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
      exposure.targetId === body.targetId &&
      (product.position !== 'JOB_LIST' || exposure.jobField === body.jobField),
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
    | (UpdateAdminAdvertisementExposureRequest & {
        productId?: number;
        jobField?: AdminJobSummaryResponseJobField | null;
      })
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
    .catch(() => null)) as
    | (UpdateAdminAdvertisementExposureRequest & {
        jobField?: AdminJobSummaryResponseJobField | null;
      })
    | null;
  if (!exposure || !body) return undefined;
  return targetError(exposure.productId, body, exposure.id);
});

export const advertisementPostingHandlers: HttpHandler[] = [
  listExposuresHandler,
  createGuardHandler,
  replaceGuardHandler,
];
