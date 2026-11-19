import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  AdminAdvertisementProductResponseCategory,
  AdminAdvertisementProductResponsePosition,
  ListAdvertisementContractsStatusItem,
  MoveAdminAdvertisementExposureRequestDirection,
  type AdminAdvertisementExposureResponse,
  type CreateAdminAdvertisementExposureRequest,
  type CreateAdminAdvertisementProductRequest,
  type UpdateAdminAdvertisementExposureRequest,
} from '../../generated/admin/models';
import { toContractSummary } from '../fixtures/advertisement-contracts';
import {
  advertisementStore,
  saveAdvertisementStore,
  type ExposureRecord,
  type ProductRecord,
} from '../fixtures/advertisement-exposures';
import { matches, ok, paginate, readPaging } from './paging';

/**
 * 광고 상품·노출·계약 어드민 핸들러(BE LC-3583·3584, `ogonggo-BE/docs/prd/2026-11-07-advertisement-api-spec.md`).
 * 저장소는 공개 배너 조회와 같이 쓴다(`../fixtures/advertisement-exposures.ts`).
 *
 * 오류는 BE 와 같은 `{ status, code, message }` 이고, 화면이 `code` 로 문구를 고르는 것들(상품 자리 불일치, 배너 내용,
 * 노출 기간, 없는 노출·상품·계약, 비즈니스 공고 계약의 상태 변경)은 BE 코드를 그대로 쓴다.
 */

const PRODUCTS = '*/api/v1/admin/advertisement-products';
const EXPOSURES = '*/api/v1/admin/advertisement-exposures';
const CONTRACTS = '*/api/v1/admin/advertisement-contracts';

/**
 * 자리마다 그 자리가 속한 카테고리(BE `AdvertisementProductPosition.category`). 생성 enum 에는 광고 공고 자리도 섞여 있어
 * 이름이 `_BANNER` 로 끝나는 것만 배너 자리로 본다.
 */
const BANNER_POSITIONS: readonly string[] = Object.values(
  AdminAdvertisementProductResponsePosition,
).filter((position) => position.endsWith('_BANNER'));
/** 광고 공고(카드) 자리(계약 8절, 판매 상품 차례). 생성 enum 에는 아직 옛 자리가 남아 있다(코드젠 전). */
const AD_POSTING_POSITIONS: readonly string[] = [
  'JOB_PICK',
  'JOB_LIST',
  'CALENDAR_DAY',
  'MYPAGE_SCRAP',
];
const POSITIONS: readonly string[] = [...BANNER_POSITIONS, ...AD_POSTING_POSITIONS];
const CATEGORIES: readonly string[] = Object.values(AdminAdvertisementProductResponseCategory);
/** 오공고 화면에 노출하는 카테고리. 인스타·카카오는 계약에 붙이는 판매 기록만 있다. */
const EXPOSABLE: readonly string[] = ['BANNER', 'JOB_POSTING'];
const NAME_MAX_LENGTH = 100;
const URL_MAX_LENGTH = 2048;

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ status, code, message }, { status });
}

const badRequest = (message: string) => error(400, 'BAD_REQUEST', message);

function nowKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

function readId(raw: unknown): number {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : Number.NaN;
}

const nextId = (rows: { id: number }[]) => Math.max(0, ...rows.map((row) => row.id)) + 1;

function activeProduct(id: number): ProductRecord | undefined {
  return advertisementStore.products.find(
    (product) => product.id === id && product.deletedAt === null,
  );
}

const productNotFound = () =>
  error(404, 'ADVERTISEMENT_PRODUCT_NOT_FOUND', '광고 상품을 찾을 수 없습니다.');
const contractNotFound = () =>
  error(404, 'ADVERTISEMENT_CONTRACT_NOT_FOUND', '광고 계약을 찾을 수 없습니다.');
const exposureNotFound = () =>
  error(404, 'ADVERTISEMENT_EXPOSURE_NOT_FOUND', '광고 노출을 찾을 수 없습니다.');

function toProductResponse({ deletedAt: _deletedAt, ...product }: ProductRecord) {
  return product;
}

/** 상품 등록·교체 본문. 처음 걸린 것 하나를 응답으로 준다. */
function productError(body: Partial<CreateAdminAdvertisementProductRequest> | null) {
  if (body === null || typeof body !== 'object') return badRequest('본문을 JSON 으로 보내 주세요.');
  if (typeof body.category !== 'string' || !CATEGORIES.includes(body.category)) {
    return badRequest('category: 카테고리를 보내 주세요.');
  }
  if (body.position != null && !POSITIONS.includes(body.position)) {
    return badRequest('position: 노출 자리를 확인해 주세요.');
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length === 0 || name.length > NAME_MAX_LENGTH) {
    return badRequest(`name: 1~${NAME_MAX_LENGTH}자로 보내 주세요.`);
  }
  if (body.price != null && (!Number.isInteger(body.price) || body.price < 0)) {
    return badRequest('price: 0 이상의 정수이거나 null 이어야 합니다.');
  }
  // 배너 자리는 배너, 광고 공고 자리는 광고 공고 상품만 된다.
  if (
    body.position != null &&
    body.category !== (AD_POSTING_POSITIONS.includes(body.position) ? 'JOB_POSTING' : 'BANNER')
  ) {
    return error(
      400,
      'ADVERTISEMENT_PRODUCT_POSITION_MISMATCH',
      '노출 자리가 상품 카테고리와 맞지 않습니다.',
    );
  }
  return null;
}

const listProductsHandler = http.get(PRODUCTS, ({ request }) => {
  const { page, size } = readPaging(new URL(request.url));
  const rows = advertisementStore.products
    .filter((product) => product.deletedAt === null)
    .sort((a, b) => a.id - b.id)
    .map(toProductResponse);
  return HttpResponse.json(ok(paginate(rows, page, size)), { status: 200 });
});

const createProductHandler = http.post(PRODUCTS, async ({ request }) => {
  const body = (await request
    .json()
    .catch(() => null)) as Partial<CreateAdminAdvertisementProductRequest> | null;
  const invalid = productError(body);
  if (invalid) return invalid;
  const input = body as CreateAdminAdvertisementProductRequest;
  const now = nowKst();
  const product: ProductRecord = {
    id: nextId(advertisementStore.products),
    category: input.category,
    position: input.position ?? null,
    name: input.name.trim(),
    price: input.price ?? null,
    registeredAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  advertisementStore.products.push(product);
  saveAdvertisementStore();
  return HttpResponse.json(
    { status: 201, message: 'Created', data: { id: product.id } },
    { status: 201 },
  );
});

const replaceProductHandler = http.put(`${PRODUCTS}/:productId`, async ({ params, request }) => {
  const product = activeProduct(readId(params.productId));
  if (!product) return productNotFound();
  const body = (await request
    .json()
    .catch(() => null)) as Partial<CreateAdminAdvertisementProductRequest> | null;
  const invalid = productError(body);
  if (invalid) return invalid;
  const input = body as CreateAdminAdvertisementProductRequest;
  Object.assign(product, {
    category: input.category,
    position: input.position ?? null,
    name: input.name.trim(),
    price: input.price ?? null,
    updatedAt: nowKst(),
  });
  saveAdvertisementStore();
  return HttpResponse.json(ok(null), { status: 200 });
});

/** 지워도 행은 남는다. 이미 맺은 계약과 노출은 이 상품을 계속 가리키고, 새로 붙이지만 못한다. */
const deleteProductHandler = http.delete(`${PRODUCTS}/:productId`, ({ params }) => {
  const product = activeProduct(readId(params.productId));
  if (!product) return productNotFound();
  product.deletedAt = nowKst();
  for (const contract of advertisementStore.contracts) {
    for (const item of contract.products) {
      if (item.productId === product.id) item.productDeleted = true;
    }
  }
  saveAdvertisementStore();
  return HttpResponse.json(ok(null), { status: 200 });
});

/** 응답의 `advertiserCompanyName` 은 BE 처럼 연결 계약에서 읽는다. */
function toExposureResponse(
  exposure: AdminAdvertisementExposureResponse,
): AdminAdvertisementExposureResponse {
  const contract = advertisementStore.contracts.find((item) => item.id === exposure.contractId);
  return { ...exposure, advertiserCompanyName: contract?.companyName ?? null };
}

function siblingsOf(productId: number): AdminAdvertisementExposureResponse[] {
  return advertisementStore.exposures
    .filter((exposure) => exposure.productId === productId)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
}

/**
 * 노출 본문을 상품 카테고리로 본다. 배너는 이름·이미지·링크가 다 있어야 하고 대상 공고가 없어야 한다. 광고 공고는 그 반대다.
 * 기간은 둘 다 없거나(상시) 둘 다 있고 시작이 끝보다 앞서야 한다.
 */
function exposureError(
  product: ProductRecord,
  body: Partial<UpdateAdminAdvertisementExposureRequest>,
) {
  if (!EXPOSABLE.includes(product.category)) {
    return error(
      400,
      'ADVERTISEMENT_PRODUCT_NOT_EXPOSABLE',
      '오공고 화면에 노출하지 않는 광고 상품입니다.',
    );
  }
  const filled = (value: string | null | undefined) =>
    typeof value === 'string' && value.trim().length > 0;
  if (product.category === 'BANNER') {
    if (
      !filled(body.name) ||
      !filled(body.imageUrl) ||
      !filled(body.linkUrl) ||
      body.targetType != null ||
      body.targetId != null
    ) {
      return error(
        400,
        'ADVERTISEMENT_BANNER_CONTENT_REQUIRED',
        '배너는 이름, 이미지, 링크만 있어야 합니다.',
      );
    }
    if ((body.name ?? '').length > NAME_MAX_LENGTH)
      return badRequest(`name: ${NAME_MAX_LENGTH}자 이하로 보내 주세요.`);
    if (
      (body.imageUrl ?? '').length > URL_MAX_LENGTH ||
      (body.linkUrl ?? '').length > URL_MAX_LENGTH
    ) {
      return badRequest(`주소는 ${URL_MAX_LENGTH}자 이하여야 합니다.`);
    }
  } else if (
    body.targetType == null ||
    body.targetId == null ||
    body.name != null ||
    body.imageUrl != null ||
    body.linkUrl != null
  ) {
    return error(
      400,
      'ADVERTISEMENT_JOB_POSTING_TARGET_REQUIRED',
      '광고 공고는 띄울 공고만 있어야 합니다.',
    );
  }
  const startAt = body.startAt ?? null;
  const endAt = body.endAt ?? null;
  if (
    !(
      (startAt === null && endAt === null) ||
      (startAt !== null && endAt !== null && startAt < endAt)
    )
  ) {
    return error(
      400,
      'ADVERTISEMENT_EXPOSURE_PERIOD_INVALID',
      '노출 기간은 시작과 끝이 함께 있어야 하고 시작이 끝보다 앞서야 합니다.',
    );
  }
  if (typeof body.adLabel !== 'boolean') return badRequest('adLabel: 참·거짓 값을 보내 주세요.');
  if (
    body.contractId != null &&
    !advertisementStore.contracts.some((item) => item.id === body.contractId)
  ) {
    return contractNotFound();
  }
  return null;
}

/** 리스트 상단 고정 노출만 직무를 남긴다. 다른 자리는 보내도 null 이다(계약 8절). */
function jobFieldOf(product: ProductRecord, body: object): string | null {
  const { jobField } = body as { jobField?: string | null };
  return String(product.position ?? '') === 'JOB_LIST' ? (jobField ?? null) : null;
}

/** `GET ?productId=&contractId=` 상품 자리 하나의 노출 전부(꺼진 것·기간 밖 포함). 순서대로 온다. */
const listExposuresHandler = http.get(EXPOSURES, ({ request }) => {
  const url = new URL(request.url);
  const productId = readId(url.searchParams.get('productId'));
  if (Number.isNaN(productId)) return badRequest('productId: 상품 id 를 보내 주세요.');
  const contractParam = url.searchParams.get('contractId');
  const contractId = contractParam === null ? null : readId(contractParam);
  const { page, size } = readPaging(url);
  const rows = siblingsOf(productId)
    .filter((exposure) => contractId === null || exposure.contractId === contractId)
    .map(toExposureResponse);
  return HttpResponse.json(ok(paginate(rows, page, size)), { status: 200 });
});

const createExposureHandler = http.post(EXPOSURES, async ({ request }) => {
  const body = (await request
    .json()
    .catch(() => null)) as Partial<CreateAdminAdvertisementExposureRequest> | null;
  if (body === null || typeof body !== 'object') return badRequest('본문을 JSON 으로 보내 주세요.');
  const product = activeProduct(readId(body.productId));
  if (!product) return productNotFound();
  const invalid = exposureError(product, body);
  if (invalid) return invalid;
  if (typeof body.exposed !== 'boolean') return badRequest('exposed: 참·거짓 값을 보내 주세요.');
  const now = nowKst();
  const exposure: ExposureRecord = {
    id: nextId(advertisementStore.exposures),
    productId: product.id,
    contractId: body.contractId ?? null,
    name: body.name?.trim() ?? null,
    imageUrl: body.imageUrl ?? null,
    linkUrl: body.linkUrl?.trim() ?? null,
    targetType: body.targetType ?? null,
    targetId: body.targetId ?? null,
    jobField: jobFieldOf(product, body),
    adLabel: body.adLabel as boolean,
    startAt: body.startAt ?? null,
    endAt: body.endAt ?? null,
    exposed: body.exposed,
    advertiserCompanyName: null,
    displayOrder: siblingsOf(product.id).length + 1,
    registeredAt: now,
    updatedAt: now,
  };
  advertisementStore.exposures.push(exposure);
  saveAdvertisementStore();
  return HttpResponse.json(
    { status: 201, message: 'Created', data: { id: exposure.id } },
    { status: 201 },
  );
});

/** 전체 교체. 빠진 칸은 null 로 저장된다. 자리(상품)·켜짐·순서는 바꾸지 않는다. 지운 상품의 노출은 고칠 수 없다. */
const replaceExposureHandler = http.put(`${EXPOSURES}/:exposureId`, async ({ params, request }) => {
  const exposure = advertisementStore.exposures.find(
    (item) => item.id === readId(params.exposureId),
  );
  if (!exposure) return exposureNotFound();
  const product = activeProduct(exposure.productId);
  if (!product) return productNotFound();
  const body = (await request
    .json()
    .catch(() => null)) as Partial<UpdateAdminAdvertisementExposureRequest> | null;
  if (body === null || typeof body !== 'object') return badRequest('본문을 JSON 으로 보내 주세요.');
  const invalid = exposureError(product, body);
  if (invalid) return invalid;
  Object.assign(exposure, {
    contractId: body.contractId ?? null,
    name: body.name?.trim() ?? null,
    imageUrl: body.imageUrl ?? null,
    linkUrl: body.linkUrl?.trim() ?? null,
    targetType: body.targetType ?? null,
    targetId: body.targetId ?? null,
    jobField: jobFieldOf(product, body),
    adLabel: body.adLabel,
    startAt: body.startAt ?? null,
    endAt: body.endAt ?? null,
    updatedAt: nowKst(),
  });
  saveAdvertisementStore();
  return HttpResponse.json(ok(null), { status: 200 });
});

const exposedHandler = http.patch(
  `${EXPOSURES}/:exposureId/exposed`,
  async ({ params, request }) => {
    const exposure = advertisementStore.exposures.find(
      (item) => item.id === readId(params.exposureId),
    );
    if (!exposure) return exposureNotFound();
    const body = (await request.json().catch(() => null)) as { exposed?: unknown } | null;
    if (typeof body?.exposed !== 'boolean') return badRequest('exposed: 참·거짓 값을 보내 주세요.');
    exposure.exposed = body.exposed;
    exposure.updatedAt = nowKst();
    saveAdvertisementStore();
    return HttpResponse.json(ok(null), { status: 200 });
  },
);

/** 같은 자리 안에서 바로 옆과 자리를 바꾸고 1부터 다시 매긴다. 이미 맨 앞(맨 뒤)이면 그대로다. */
const moveHandler = http.post(`${EXPOSURES}/:exposureId/move`, async ({ params, request }) => {
  const exposure = advertisementStore.exposures.find(
    (item) => item.id === readId(params.exposureId),
  );
  if (!exposure) return exposureNotFound();
  const body = (await request.json().catch(() => null)) as { direction?: unknown } | null;
  const direction = body?.direction;
  if (
    direction !== MoveAdminAdvertisementExposureRequestDirection.UP &&
    direction !== MoveAdminAdvertisementExposureRequestDirection.DOWN
  ) {
    return badRequest('direction: UP 또는 DOWN 을 보내 주세요.');
  }
  const siblings = siblingsOf(exposure.productId);
  const index = siblings.indexOf(exposure);
  const target = direction === 'UP' ? index - 1 : index + 1;
  if (target >= 0 && target < siblings.length) {
    [siblings[index], siblings[target]] = [siblings[target]!, siblings[index]!];
  }
  siblings.forEach((sibling, order) => {
    sibling.displayOrder = order + 1;
  });
  saveAdvertisementStore();
  return HttpResponse.json(ok(null), { status: 200 });
});

const deleteExposureHandler = http.delete(`${EXPOSURES}/:exposureId`, ({ params }) => {
  const id = readId(params.exposureId);
  if (!advertisementStore.exposures.some((item) => item.id === id)) return exposureNotFound();
  advertisementStore.exposures = advertisementStore.exposures.filter((item) => item.id !== id);
  saveAdvertisementStore();
  return HttpResponse.json(ok(null), { status: 200 });
});

const STATUSES: readonly string[] = Object.values(ListAdvertisementContractsStatusItem);

/**
 * 계약 목록. 거르기는 모두 AND 이고 `status` 는 여러 번 보내면 그중 하나다. 회사명은 앞뒤 공백을 뺀 부분 일치, 신청일은
 * 양끝 포함이다. 최신 신청이 먼저다.
 */
const listContractsHandler = http.get(CONTRACTS, ({ request }) => {
  const url = new URL(request.url);
  const params = url.searchParams;
  const statuses = params.getAll('status').filter((status) => STATUSES.includes(status));
  const source = params.get('source');
  const promotionTarget = params.get('promotionTarget');
  const category = params.get('category');
  const companyName = params.get('companyName')?.trim() ?? '';
  const createdFrom = params.get('createdFrom');
  const createdTo = params.get('createdTo');
  const { page, size } = readPaging(url);
  const rows = advertisementStore.contracts
    .filter(
      (contract) =>
        (statuses.length === 0 || statuses.includes(contract.status)) &&
        (!source || contract.source === source) &&
        (!promotionTarget || contract.promotionTarget === promotionTarget) &&
        (!category || (contract.categories as string[]).includes(category)) &&
        (!companyName || matches(contract.companyName, companyName)) &&
        (!createdFrom || contract.registeredAt.slice(0, 10) >= createdFrom) &&
        (!createdTo || contract.registeredAt.slice(0, 10) <= createdTo),
    )
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt) || b.id - a.id)
    .map(toContractSummary);
  return HttpResponse.json(ok(paginate(rows, page, size)), { status: 200 });
});

function findContract(raw: unknown) {
  const id = readId(raw);
  return advertisementStore.contracts.find((contract) => contract.id === id);
}

const getContractHandler = http.get(`${CONTRACTS}/:contractId`, ({ params }) => {
  const contract = findContract(params.contractId);
  if (!contract) return contractNotFound();
  return HttpResponse.json(ok(contract), { status: 200 });
});

/** 신청 폼 계약만 바꾼다. 비즈니스 공고 계약은 공고 검수를 따라가 409 다. */
const changeStatusHandler = http.patch(
  `${CONTRACTS}/:contractId/status`,
  async ({ params, request }) => {
    const contract = findContract(params.contractId);
    if (!contract) return contractNotFound();
    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
    if (typeof body?.status !== 'string' || !STATUSES.includes(body.status)) {
      return badRequest('status: 계약 상태를 보내 주세요.');
    }
    if (contract.source === 'COMPANY_POSTING') {
      return error(
        409,
        'ADVERTISEMENT_CONTRACT_FOLLOWS_REVIEW',
        '비즈니스 공고 계약의 상태는 공고 검수로만 바뀝니다.',
      );
    }
    contract.status = body.status as typeof contract.status;
    contract.updatedAt = nowKst();
    saveAdvertisementStore();
    return HttpResponse.json(ok(null), { status: 200 });
  },
);

/** `null` 이면 금액을 지운다. 0 은 0원이다. */
const changePaymentAmountHandler = http.patch(
  `${CONTRACTS}/:contractId/payment-amount`,
  async ({ params, request }) => {
    const contract = findContract(params.contractId);
    if (!contract) return contractNotFound();
    const body = (await request.json().catch(() => null)) as { paymentAmount?: unknown } | null;
    const amount = body?.paymentAmount;
    if (
      amount !== null &&
      (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 0)
    ) {
      return badRequest('paymentAmount: 0 이상의 정수이거나 null 이어야 합니다.');
    }
    contract.paymentAmount = amount ?? undefined;
    contract.updatedAt = nowKst();
    saveAdvertisementStore();
    return HttpResponse.json(ok(null), { status: 200 });
  },
);

/**
 * 같은 상품을 여러 번 붙여도 막지 않는다(기간을 나눠 파는 경우). 지운 상품은 붙이지 못한다. 게시 기간은 필수이고 시작일이
 * 종료일보다 늦으면 400 이다(BE LC-3599).
 */
const addContractProductHandler = http.post(
  `${CONTRACTS}/:contractId/products`,
  async ({ params, request }) => {
    const contract = findContract(params.contractId);
    if (!contract) return contractNotFound();
    const body = (await request.json().catch(() => null)) as {
      productId?: unknown;
      startDate?: unknown;
      endDate?: unknown;
    } | null;
    const product = activeProduct(readId(body?.productId));
    if (!product) return productNotFound();
    const startDate = typeof body?.startDate === 'string' ? body.startDate : '';
    const endDate = typeof body?.endDate === 'string' ? body.endDate : '';
    if (!startDate || !endDate) {
      return badRequest('게시 시작일과 종료일을 넣어 주세요.');
    }
    if (startDate > endDate) {
      return error(
        400,
        'ADVERTISEMENT_CONTRACT_PRODUCT_PERIOD_INVALID',
        '게시 시작일은 종료일보다 늦을 수 없습니다.',
      );
    }
    const id =
      Math.max(
        0,
        ...advertisementStore.contracts.flatMap((item) =>
          item.products.map((cp) => cp.contractProductId),
        ),
      ) + 1;
    contract.products.push({
      contractProductId: id,
      productId: product.id,
      productName: product.name,
      category: product.category,
      productDeleted: false,
      startDate,
      endDate,
      addedAt: nowKst(),
    });
    saveAdvertisementStore();
    return HttpResponse.json({ status: 201, message: 'Created', data: { id } }, { status: 201 });
  },
);

const removeContractProductHandler = http.delete(
  `${CONTRACTS}/:contractId/products/:contractProductId`,
  ({ params }) => {
    const contract = findContract(params.contractId);
    if (!contract) return contractNotFound();
    const id = readId(params.contractProductId);
    if (!contract.products.some((item) => item.contractProductId === id)) {
      return error(
        404,
        'ADVERTISEMENT_CONTRACT_PRODUCT_NOT_FOUND',
        '계약에 붙인 광고 상품을 찾을 수 없습니다.',
      );
    }
    contract.products = contract.products.filter((item) => item.contractProductId !== id);
    saveAdvertisementStore();
    return HttpResponse.json(ok(null), { status: 200 });
  },
);

export const advertisementAdminHandlers: HttpHandler[] = [
  listProductsHandler,
  createProductHandler,
  replaceProductHandler,
  deleteProductHandler,
  listExposuresHandler,
  createExposureHandler,
  // `/exposed`·`/move` 를 `:exposureId` 보다 앞에 둔다(메서드가 달라 지금은 겹치지 않지만 순서로도 막는다).
  exposedHandler,
  moveHandler,
  replaceExposureHandler,
  deleteExposureHandler,
  listContractsHandler,
  getContractHandler,
  changeStatusHandler,
  changePaymentAmountHandler,
  addContractProductHandler,
  removeContractProductHandler,
];
