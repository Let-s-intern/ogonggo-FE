import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  AD_CONTRACT_PRODUCTS,
  type AdminAdContractRequest,
  type AdminAdContractResponse,
} from '../../ad-contracts';
import { adContractStore, saveAdContracts, type AdContractRecord } from '../fixtures/ad-contracts';
import { adPostingStore, saveAdPostings } from '../fixtures/ad-postings';
import { findAdvertiser } from '../fixtures/advertisers';
import { bannerStore, saveBanners } from '../fixtures/banners';
import { notFound, ok } from './paging';

/**
 * 광고 계약 핸들러(이슈 #573). 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 의 "광고 계약".
 *
 * - `GET    /api/v1/admin/advertisers/{advertiserId}/contracts` 그 광고주의 계약 전부. 시작이 늦은 것이 먼저
 * - `POST   /api/v1/admin/advertisers/{advertiserId}/contracts` 등록
 * - `PATCH  /api/v1/admin/advertiser-contracts/{contractId}`     보낸 칸만 수정
 * - `DELETE /api/v1/admin/advertiser-contracts/{contractId}`     삭제. 이어 둔 배너·광고 공고는 남기고 계약만 끊는다
 */

const NESTED_PATH = '*/api/v1/admin/advertisers/:advertiserId/contracts';
const PATH = '*/api/v1/admin/advertiser-contracts/:contractId';
const NAME_MAX_LENGTH = 50;
const MEMO_MAX_LENGTH = 500;
/** 100억 원 미만. 어드민 입력도 열 자리까지 받는다. */
const AMOUNT_MAX = 9_999_999_999;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PRODUCTS: readonly string[] = AD_CONTRACT_PRODUCTS;

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

function nowKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

function readId(raw: unknown): number {
  const id = Number(raw);
  return Number.isInteger(id) ? id : Number.NaN;
}

/** 이어 둔 배너·광고 공고 수를 붙인다. */
function toResponse(contract: AdContractRecord): AdminAdContractResponse {
  return {
    ...contract,
    bannerCount: bannerStore.banners.filter((banner) => banner.contractId === contract.id).length,
    adPostingCount: adPostingStore.adPostings.filter((ad) => ad.contractId === contract.id).length,
  };
}

const trimmedOrNull = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/** 합친 결과(등록은 본문 전부, 수정은 저장된 값 위에 보낸 칸)를 본다. 처음 걸린 것 하나만 알린다. */
function validate(contract: AdminAdContractRequest): string | null {
  if (contract.name !== null && contract.name.length > NAME_MAX_LENGTH) {
    return `name: ${NAME_MAX_LENGTH}자까지 보낼 수 있습니다.`;
  }
  for (const key of ['startAt', 'endAt'] as const) {
    if (typeof contract[key] !== 'string' || !DATE_TIME.test(contract[key])) {
      return `${key}: YYYY-MM-DDTHH:mm:ss(KST) 로 보내 주세요.`;
    }
  }
  if (contract.startAt >= contract.endAt) {
    return 'endAt: 광고 끝은 시작보다 뒤여야 합니다.';
  }
  if (!Number.isInteger(contract.amount) || contract.amount < 0 || contract.amount > AMOUNT_MAX) {
    return 'amount: 0 이상의 정수(원)로 보내 주세요.';
  }
  if (typeof contract.vatIncluded !== 'boolean') {
    return 'vatIncluded: 참·거짓 값을 보내 주세요.';
  }
  if (typeof contract.paid !== 'boolean') {
    return 'paid: 참·거짓 값을 보내 주세요.';
  }
  if (contract.paidDate !== null && !DATE.test(contract.paidDate)) {
    return 'paidDate: null 이거나 YYYY-MM-DD 로 보내 주세요.';
  }
  if (
    !Array.isArray(contract.products) ||
    contract.products.some((product) => !PRODUCTS.includes(product)) ||
    new Set(contract.products).size !== contract.products.length
  ) {
    return `products: ${AD_CONTRACT_PRODUCTS.join(', ')} 가운데 겹치지 않게 보내 주세요.`;
  }
  if (contract.memo !== null && contract.memo.length > MEMO_MAX_LENGTH) {
    return `memo: ${MEMO_MAX_LENGTH}자까지 보낼 수 있습니다.`;
  }
  return null;
}

/** 본문을 다듬는다. 결제 전이면 결제일을 지운다. 상품은 정해진 순서로 둔다. */
function normalize(input: AdminAdContractRequest): AdminAdContractRequest {
  return {
    ...input,
    name: trimmedOrNull(input.name),
    memo: trimmedOrNull(input.memo),
    paidDate: input.paid ? input.paidDate : null,
    products: AD_CONTRACT_PRODUCTS.filter((product) => input.products.includes(product)),
  };
}

const listHandler = http.get(NESTED_PATH, ({ params }) => {
  const advertiserId = readId(params.advertiserId);
  if (!findAdvertiser(advertiserId)) {
    return HttpResponse.json(notFound('광고주를 찾을 수 없습니다.'), { status: 404 });
  }
  const contracts = adContractStore.contracts
    .filter((contract) => contract.advertiserId === advertiserId)
    .sort((a, b) => (a.startAt === b.startAt ? b.id - a.id : a.startAt < b.startAt ? 1 : -1));
  return HttpResponse.json(ok(contracts.map(toResponse)), { status: 200 });
});

const createHandler = http.post(NESTED_PATH, async ({ params, request }) => {
  const advertiserId = readId(params.advertiserId);
  if (!findAdvertiser(advertiserId)) {
    return HttpResponse.json(notFound('광고주를 찾을 수 없습니다.'), { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as Partial<AdminAdContractRequest> | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const input: AdminAdContractRequest = {
    name: typeof body.name === 'string' ? body.name : null,
    startAt: body.startAt as string,
    endAt: body.endAt as string,
    amount: body.amount as number,
    vatIncluded: body.vatIncluded as boolean,
    paid: body.paid as boolean,
    paidDate: body.paidDate ?? null,
    products: body.products ?? [],
    memo: typeof body.memo === 'string' ? body.memo : null,
  };
  const error = validate(input);
  if (error) {
    return badRequest(error);
  }
  const now = nowKst();
  const contract: AdContractRecord = {
    ...normalize(input),
    id: Math.max(0, ...adContractStore.contracts.map((item) => item.id)) + 1,
    advertiserId,
    createdAt: now,
    updatedAt: now,
  };
  adContractStore.contracts.push(contract);
  saveAdContracts();
  return HttpResponse.json(
    { ...ok(toResponse(contract)), status: 201, message: 'Created' },
    { status: 201 },
  );
});

const patchHandler = http.patch(PATH, async ({ params, request }) => {
  const contract = adContractStore.contracts.find((item) => item.id === readId(params.contractId));
  if (!contract) {
    return HttpResponse.json(notFound('계약을 찾을 수 없습니다.'), { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as Partial<AdminAdContractRequest> | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const merged: AdminAdContractRequest = {
    name: contract.name,
    startAt: contract.startAt,
    endAt: contract.endAt,
    amount: contract.amount,
    vatIncluded: contract.vatIncluded,
    paid: contract.paid,
    paidDate: contract.paidDate,
    products: contract.products,
    memo: contract.memo,
  };
  for (const key of Object.keys(merged) as (keyof AdminAdContractRequest)[]) {
    if (body[key] !== undefined) {
      Object.assign(merged, { [key]: body[key] });
    }
  }
  const error = validate(merged);
  if (error) {
    return badRequest(error);
  }
  Object.assign(contract, normalize(merged), { updatedAt: nowKst() });
  saveAdContracts();
  return HttpResponse.json(ok(toResponse(contract)), { status: 200 });
});

const deleteHandler = http.delete(PATH, ({ params }) => {
  const id = readId(params.contractId);
  if (!adContractStore.contracts.some((item) => item.id === id)) {
    return HttpResponse.json(notFound('계약을 찾을 수 없습니다.'), { status: 404 });
  }
  adContractStore.contracts = adContractStore.contracts.filter((item) => item.id !== id);
  // 광고는 지우지 않는다. 계약만 끊어 두면 운영자가 다른 계약에 다시 잇거나 그대로 둔다.
  for (const banner of bannerStore.banners) {
    if (banner.contractId === id) banner.contractId = null;
  }
  for (const ad of adPostingStore.adPostings) {
    if (ad.contractId === id) ad.contractId = null;
  }
  saveAdContracts();
  saveBanners();
  saveAdPostings();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

export const adContractAdminHandlers: HttpHandler[] = [
  listHandler,
  createHandler,
  patchHandler,
  deleteHandler,
];
