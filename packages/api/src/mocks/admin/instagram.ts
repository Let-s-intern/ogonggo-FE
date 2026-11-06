import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  INSTAGRAM_AD_STATUSES,
  type AdminInstagramAccountRequest,
  type AdminInstagramAccountResponse,
  type AdminInstagramAdRequest,
  type AdminInstagramAdResponse,
  type AdminInstagramFormatRequest,
  type AdminInstagramFormatResponse,
} from '../../instagram';
import { adContractLinkError, adContractSummary } from '../fixtures/ad-contracts';
import { advertiserSummary, findAdvertiser } from '../fixtures/advertisers';
import {
  instagramStore,
  saveInstagram,
  type InstagramAccountRecord,
  type InstagramAdRecord,
  type InstagramFormatRecord,
} from '../fixtures/instagram';
import { notFound, ok } from './paging';

/**
 * 인스타그램 광고 핸들러(이슈 #573). 계약은 `.claude/tasks/memos/백엔드-요청-인스타-광고-2026-11-06.md`.
 *
 * - `GET/POST     /api/v1/admin/instagram-accounts`            계정 목록(등록 순)·등록
 * - `PATCH/DELETE /api/v1/admin/instagram-accounts/{id}`       수정·삭제. 광고가 잡힌 계정은 지울 수 없다(400)
 * - `GET/POST     /api/v1/admin/instagram-formats`             게재 유형 목록(순서대로)·등록(맨 뒤)
 * - `PUT          /api/v1/admin/instagram-formats/order`       `{ formatIds }` 로 순서를 통째로 바꾼다
 * - `PATCH/DELETE /api/v1/admin/instagram-formats/{id}`        수정·삭제. 광고가 잡힌 유형은 지울 수 없다(400)
 * - `GET/POST     /api/v1/admin/instagram-ads`                 인스타 광고 목록(거르기)·등록
 * - `PATCH/DELETE /api/v1/admin/instagram-ads/{id}`            보낸 칸만 수정·삭제
 */

const ACCOUNTS_PATH = '*/api/v1/admin/instagram-accounts';
const FORMATS_PATH = '*/api/v1/admin/instagram-formats';
const ADS_PATH = '*/api/v1/admin/instagram-ads';
const HANDLE = /^[A-Za-z0-9._]{1,30}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;
const URL_PATTERN = /^https?:\/\/\S+$/;
const IMAGE_URL = /^(https?:\/\/\S+|\/\S*)$/;
const NAME_MAX_LENGTH = 50;
const TEXT_MAX_LENGTH = 500;
const MEMO_MAX_LENGTH = 1000;
const PRICE_MAX = 9_999_999_999;

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

const nextId = (items: { id: number }[]) => Math.max(0, ...items.map((item) => item.id)) + 1;

const trimmedOrNull = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

async function readBody<T>(request: Request): Promise<Partial<T> | null> {
  const body = (await request.json().catch(() => null)) as Partial<T> | null;
  return body !== null && typeof body === 'object' ? body : null;
}

/** 저장된 값 위에 본문에 온 칸만 덮는다. */
function merge<T extends object>(base: T, body: Partial<T>): T {
  const merged = { ...base };
  for (const key of Object.keys(base) as (keyof T)[]) {
    if (body[key] !== undefined) {
      merged[key] = body[key] as T[keyof T];
    }
  }
  return merged;
}

// ---------------------------------------------------------------- 계정

function toAccountResponse(account: InstagramAccountRecord): AdminInstagramAccountResponse {
  return {
    ...account,
    adCount: instagramStore.ads.filter((ad) => ad.accountId === account.id).length,
  };
}

function normalizeAccount(input: AdminInstagramAccountRequest): AdminInstagramAccountRequest {
  return {
    handle: typeof input.handle === 'string' ? input.handle.trim().replace(/^@/, '') : '',
    displayName: typeof input.displayName === 'string' ? input.displayName.trim() : '',
    profileUrl: typeof input.profileUrl === 'string' ? input.profileUrl.trim() : '',
    profileImageUrl: trimmedOrNull(input.profileImageUrl),
    enabled: input.enabled,
    memo: trimmedOrNull(input.memo),
  };
}

function validateAccount(account: AdminInstagramAccountRequest, selfId: number | null) {
  if (!HANDLE.test(account.handle)) {
    return 'handle: 영문·숫자·마침표·밑줄 30자까지로 보내 주세요(`@` 는 빼도 됩니다).';
  }
  if (
    instagramStore.accounts.some(
      (item) => item.id !== selfId && item.handle.toLowerCase() === account.handle.toLowerCase(),
    )
  ) {
    return 'handle: 이미 등록된 계정입니다.';
  }
  if (!account.displayName || account.displayName.length > NAME_MAX_LENGTH) {
    return `displayName: 1~${NAME_MAX_LENGTH}자로 보내 주세요.`;
  }
  if (!URL_PATTERN.test(account.profileUrl)) {
    return 'profileUrl: http:// 또는 https:// 로 시작하는 주소를 보내 주세요.';
  }
  if (account.profileImageUrl !== null && !IMAGE_URL.test(account.profileImageUrl)) {
    return 'profileImageUrl: null 이거나 https:// 주소, / 로 시작하는 경로로 보내 주세요.';
  }
  if (typeof account.enabled !== 'boolean') {
    return 'enabled: 참·거짓 값을 보내 주세요.';
  }
  if (account.memo !== null && account.memo.length > TEXT_MAX_LENGTH) {
    return `memo: ${TEXT_MAX_LENGTH}자까지 보낼 수 있습니다.`;
  }
  return null;
}

const listAccountsHandler = http.get(ACCOUNTS_PATH, () =>
  HttpResponse.json(ok(instagramStore.accounts.map(toAccountResponse)), { status: 200 }),
);

const createAccountHandler = http.post(ACCOUNTS_PATH, async ({ request }) => {
  const body = await readBody<AdminInstagramAccountRequest>(request);
  if (!body) {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const input = normalizeAccount({
    handle: body.handle ?? '',
    displayName: body.displayName ?? '',
    profileUrl: body.profileUrl ?? '',
    profileImageUrl: body.profileImageUrl ?? null,
    enabled: body.enabled ?? true,
    memo: body.memo ?? null,
  });
  const error = validateAccount(input, null);
  if (error) {
    return badRequest(error);
  }
  const now = nowKst();
  const account: InstagramAccountRecord = {
    ...input,
    id: nextId(instagramStore.accounts),
    createdAt: now,
    updatedAt: now,
  };
  instagramStore.accounts.push(account);
  saveInstagram();
  return HttpResponse.json(
    { ...ok(toAccountResponse(account)), status: 201, message: 'Created' },
    { status: 201 },
  );
});

const patchAccountHandler = http.patch(
  `${ACCOUNTS_PATH}/:accountId`,
  async ({ params, request }) => {
    const account = instagramStore.accounts.find((item) => item.id === readId(params.accountId));
    if (!account) {
      return HttpResponse.json(notFound('계정을 찾을 수 없습니다.'), { status: 404 });
    }
    const body = await readBody<AdminInstagramAccountRequest>(request);
    if (!body) {
      return badRequest('본문을 JSON 으로 보내 주세요.');
    }
    const { handle, displayName, profileUrl, profileImageUrl, enabled, memo } = account;
    const merged = normalizeAccount(
      merge({ handle, displayName, profileUrl, profileImageUrl, enabled, memo }, body),
    );
    const error = validateAccount(merged, account.id);
    if (error) {
      return badRequest(error);
    }
    Object.assign(account, merged, { updatedAt: nowKst() });
    saveInstagram();
    return HttpResponse.json(ok(toAccountResponse(account)), { status: 200 });
  },
);

const deleteAccountHandler = http.delete(`${ACCOUNTS_PATH}/:accountId`, ({ params }) => {
  const id = readId(params.accountId);
  if (!instagramStore.accounts.some((item) => item.id === id)) {
    return HttpResponse.json(notFound('계정을 찾을 수 없습니다.'), { status: 404 });
  }
  if (instagramStore.ads.some((ad) => ad.accountId === id)) {
    return badRequest(
      '이 계정에 잡힌 인스타 광고가 있어 지울 수 없습니다. 사용 안 함으로 바꿔 주세요.',
    );
  }
  instagramStore.accounts = instagramStore.accounts.filter((item) => item.id !== id);
  for (const format of instagramStore.formats) {
    format.accountIds = format.accountIds.filter((accountId) => accountId !== id);
  }
  saveInstagram();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

// ---------------------------------------------------------------- 게재 유형

function toFormatResponse(format: InstagramFormatRecord): AdminInstagramFormatResponse {
  return {
    ...format,
    adCount: instagramStore.ads.filter((ad) => ad.formatId === format.id).length,
  };
}

const sortedFormats = () =>
  [...instagramStore.formats].sort((a, b) => a.displayOrder - b.displayOrder);

function normalizeFormat(input: AdminInstagramFormatRequest): AdminInstagramFormatRequest {
  return {
    name: typeof input.name === 'string' ? input.name.trim() : '',
    description: trimmedOrNull(input.description),
    enabled: input.enabled,
    defaultPrice: input.defaultPrice,
    accountIds: Array.isArray(input.accountIds)
      ? instagramStore.accounts
          .map((account) => account.id)
          .filter((id) => input.accountIds.includes(id))
      : input.accountIds,
  };
}

function validateFormat(format: AdminInstagramFormatRequest, selfId: number | null) {
  if (!format.name || format.name.length > NAME_MAX_LENGTH) {
    return `name: 1~${NAME_MAX_LENGTH}자로 보내 주세요.`;
  }
  if (instagramStore.formats.some((item) => item.id !== selfId && item.name === format.name)) {
    return 'name: 같은 이름의 게재 유형이 있습니다.';
  }
  if (format.description !== null && format.description.length > TEXT_MAX_LENGTH) {
    return `description: ${TEXT_MAX_LENGTH}자까지 보낼 수 있습니다.`;
  }
  if (typeof format.enabled !== 'boolean') {
    return 'enabled: 참·거짓 값을 보내 주세요.';
  }
  if (
    format.defaultPrice !== null &&
    (!Number.isInteger(format.defaultPrice) ||
      format.defaultPrice < 0 ||
      format.defaultPrice > PRICE_MAX)
  ) {
    return 'defaultPrice: null 이거나 0 이상의 정수(원)로 보내 주세요.';
  }
  if (!Array.isArray(format.accountIds)) {
    return 'accountIds: 계정 id 배열로 보내 주세요. 비우면 모든 계정입니다.';
  }
  return null;
}

const listFormatsHandler = http.get(FORMATS_PATH, () =>
  HttpResponse.json(ok(sortedFormats().map(toFormatResponse)), { status: 200 }),
);

const createFormatHandler = http.post(FORMATS_PATH, async ({ request }) => {
  const body = await readBody<AdminInstagramFormatRequest>(request);
  if (!body) {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const input = normalizeFormat({
    name: body.name ?? '',
    description: body.description ?? null,
    enabled: body.enabled ?? true,
    defaultPrice: body.defaultPrice ?? null,
    accountIds: body.accountIds ?? [],
  });
  const error = validateFormat(input, null);
  if (error) {
    return badRequest(error);
  }
  const now = nowKst();
  const format: InstagramFormatRecord = {
    ...input,
    id: nextId(instagramStore.formats),
    displayOrder: Math.max(0, ...instagramStore.formats.map((item) => item.displayOrder)) + 1,
    createdAt: now,
    updatedAt: now,
  };
  instagramStore.formats.push(format);
  saveInstagram();
  return HttpResponse.json(
    { ...ok(toFormatResponse(format)), status: 201, message: 'Created' },
    { status: 201 },
  );
});

// `/:formatId` 보다 앞에 둔다. 뒤에 두면 `order` 를 id 로 읽는다.
const reorderFormatsHandler = http.put(`${FORMATS_PATH}/order`, async ({ request }) => {
  const body = await readBody<{ formatIds: number[] }>(request);
  const ids = body?.formatIds;
  const current = instagramStore.formats.map((format) => format.id);
  if (
    !Array.isArray(ids) ||
    ids.length !== current.length ||
    new Set(ids).size !== ids.length ||
    !current.every((id) => ids.includes(id))
  ) {
    return badRequest('formatIds: 모든 게재 유형 id 를 빠짐없이, 겹치지 않게 보내 주세요.');
  }
  ids.forEach((id, index) => {
    const format = instagramStore.formats.find((item) => item.id === id);
    if (format) format.displayOrder = index + 1;
  });
  saveInstagram();
  return HttpResponse.json(ok(sortedFormats().map(toFormatResponse)), { status: 200 });
});

const patchFormatHandler = http.patch(`${FORMATS_PATH}/:formatId`, async ({ params, request }) => {
  const format = instagramStore.formats.find((item) => item.id === readId(params.formatId));
  if (!format) {
    return HttpResponse.json(notFound('게재 유형을 찾을 수 없습니다.'), { status: 404 });
  }
  const body = await readBody<AdminInstagramFormatRequest>(request);
  if (!body) {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const { name, description, enabled, defaultPrice, accountIds } = format;
  const merged = normalizeFormat(
    merge({ name, description, enabled, defaultPrice, accountIds }, body),
  );
  const error = validateFormat(merged, format.id);
  if (error) {
    return badRequest(error);
  }
  Object.assign(format, merged, { updatedAt: nowKst() });
  saveInstagram();
  return HttpResponse.json(ok(toFormatResponse(format)), { status: 200 });
});

const deleteFormatHandler = http.delete(`${FORMATS_PATH}/:formatId`, ({ params }) => {
  const id = readId(params.formatId);
  if (!instagramStore.formats.some((item) => item.id === id)) {
    return HttpResponse.json(notFound('게재 유형을 찾을 수 없습니다.'), { status: 404 });
  }
  if (instagramStore.ads.some((ad) => ad.formatId === id)) {
    return badRequest(
      '이 유형으로 잡힌 인스타 광고가 있어 지울 수 없습니다. 사용 안 함으로 바꿔 주세요.',
    );
  }
  instagramStore.formats = sortedFormats().filter((item) => item.id !== id);
  instagramStore.formats.forEach((format, index) => {
    format.displayOrder = index + 1;
  });
  saveInstagram();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

// ---------------------------------------------------------------- 인스타 광고

export function toInstagramAdResponse(ad: InstagramAdRecord): AdminInstagramAdResponse {
  const account = instagramStore.accounts.find((item) => item.id === ad.accountId);
  const format = instagramStore.formats.find((item) => item.id === ad.formatId);
  return {
    ...ad,
    advertiser: advertiserSummary(ad.advertiserId),
    contract: adContractSummary(ad.contractId),
    account: account
      ? { id: account.id, handle: account.handle, displayName: account.displayName }
      : null,
    format: format ? { id: format.id, name: format.name } : null,
  };
}

/** 인스타 광고가 차지하는 날 `[postDate, endDate ?? postDate]`(둘 다 포함)이 `[from, toExclusive)` 와 겹치는가. */
export function instagramAdOverlaps(ad: InstagramAdRecord, from: string, toExclusive: string) {
  return ad.postDate < toExclusive && (ad.endDate ?? ad.postDate) >= from;
}

/** 다음 달 1일. `2026-12` → `2027-01-01`. */
function nextMonthStart(month: string): string {
  const [year, value] = month.split('-').map(Number) as [number, number];
  return value === 12 ? `${year + 1}-01-01` : `${year}-${String(value + 1).padStart(2, '0')}-01`;
}

function normalizeAd(input: AdminInstagramAdRequest): AdminInstagramAdRequest {
  return {
    ...input,
    postUrl: trimmedOrNull(input.postUrl),
    creativeMemo: trimmedOrNull(input.creativeMemo),
    adminMemo: trimmedOrNull(input.adminMemo),
  };
}

function validateAd(ad: AdminInstagramAdRequest, previous: InstagramAdRecord | null) {
  if (!findAdvertiser(ad.advertiserId)) {
    return 'advertiserId: 있는 광고주를 골라 주세요.';
  }
  const contractError = adContractLinkError(ad.contractId, ad.advertiserId);
  if (contractError) {
    return contractError;
  }
  const account = instagramStore.accounts.find((item) => item.id === ad.accountId);
  if (!account) {
    return 'accountId: 있는 계정을 골라 주세요.';
  }
  // 끈 계정·유형은 새로 고를 수 없다. 이미 그 값으로 잡힌 광고는 그대로 둘 수 있다.
  if (!account.enabled && previous?.accountId !== account.id) {
    return 'accountId: 사용 안 함인 계정은 고를 수 없습니다.';
  }
  const format = instagramStore.formats.find((item) => item.id === ad.formatId);
  if (!format) {
    return 'formatId: 있는 게재 유형을 골라 주세요.';
  }
  if (!format.enabled && previous?.formatId !== format.id) {
    return 'formatId: 사용 안 함인 게재 유형은 고를 수 없습니다.';
  }
  if (format.accountIds.length > 0 && !format.accountIds.includes(account.id)) {
    return `formatId: @${account.handle} 계정은 ${format.name} 을(를) 올리지 않습니다.`;
  }
  if (typeof ad.postDate !== 'string' || !DATE.test(ad.postDate)) {
    return 'postDate: YYYY-MM-DD(KST) 로 보내 주세요.';
  }
  if (ad.endDate !== null && (!DATE.test(ad.endDate) || ad.endDate < ad.postDate)) {
    return 'endDate: null 이거나 게시 예정일과 같거나 뒤인 YYYY-MM-DD 로 보내 주세요.';
  }
  if (!INSTAGRAM_AD_STATUSES.includes(ad.status)) {
    return `status: ${INSTAGRAM_AD_STATUSES.join(', ')} 가운데 하나로 보내 주세요.`;
  }
  if (ad.postUrl !== null && !URL_PATTERN.test(ad.postUrl)) {
    return 'postUrl: null 이거나 http:// 또는 https:// 로 시작하는 주소로 보내 주세요.';
  }
  for (const key of ['creativeMemo', 'adminMemo'] as const) {
    const value = ad[key];
    if (value !== null && value.length > MEMO_MAX_LENGTH) {
      return `${key}: ${MEMO_MAX_LENGTH}자까지 보낼 수 있습니다.`;
    }
  }
  return null;
}

const listAdsHandler = http.get(ADS_PATH, ({ request }) => {
  const params = new URL(request.url).searchParams;
  const month = params.get('month') ?? '';
  if (month && !MONTH.test(month)) {
    return badRequest('month: YYYY-MM 로 보내 주세요.');
  }
  const numberParam = (key: string) => {
    const raw = params.get(key);
    return raw === null || raw === '' ? null : Number(raw);
  };
  const advertiserId = numberParam('advertiserId');
  const contractId = numberParam('contractId');
  const accountId = numberParam('accountId');
  const formatId = numberParam('formatId');
  const status = params.get('status') ?? '';
  const ads = instagramStore.ads
    .filter(
      (ad) =>
        (!month || instagramAdOverlaps(ad, `${month}-01`, nextMonthStart(month))) &&
        (advertiserId === null || ad.advertiserId === advertiserId) &&
        (contractId === null || ad.contractId === contractId) &&
        (accountId === null || ad.accountId === accountId) &&
        (formatId === null || ad.formatId === formatId) &&
        (!status || ad.status === status),
    )
    .sort((a, b) => (a.postDate === b.postDate ? a.id - b.id : a.postDate < b.postDate ? -1 : 1));
  return HttpResponse.json(ok(ads.map(toInstagramAdResponse)), { status: 200 });
});

const createAdHandler = http.post(ADS_PATH, async ({ request }) => {
  const body = await readBody<AdminInstagramAdRequest>(request);
  if (!body) {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const input = normalizeAd({
    advertiserId: body.advertiserId as number,
    contractId: body.contractId ?? null,
    accountId: body.accountId as number,
    formatId: body.formatId as number,
    postDate: body.postDate as string,
    endDate: body.endDate ?? null,
    status: body.status ?? 'SCHEDULED',
    postUrl: body.postUrl ?? null,
    creativeMemo: body.creativeMemo ?? null,
    adminMemo: body.adminMemo ?? null,
  });
  const error = validateAd(input, null);
  if (error) {
    return badRequest(error);
  }
  const now = nowKst();
  const ad: InstagramAdRecord = {
    ...input,
    id: nextId(instagramStore.ads),
    createdAt: now,
    updatedAt: now,
  };
  instagramStore.ads.push(ad);
  saveInstagram();
  return HttpResponse.json(
    { ...ok(toInstagramAdResponse(ad)), status: 201, message: 'Created' },
    { status: 201 },
  );
});

const patchAdHandler = http.patch(`${ADS_PATH}/:adId`, async ({ params, request }) => {
  const ad = instagramStore.ads.find((item) => item.id === readId(params.adId));
  if (!ad) {
    return HttpResponse.json(notFound('인스타 광고를 찾을 수 없습니다.'), { status: 404 });
  }
  const body = await readBody<AdminInstagramAdRequest>(request);
  if (!body) {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...current } = ad;
  // 광고주를 바꾸면서 계약을 보내지 않으면 다른 광고주의 계약이 남지 않게 끊는다.
  const base =
    body.advertiserId !== undefined && body.advertiserId !== ad.advertiserId
      ? { ...current, contractId: null }
      : current;
  const merged = normalizeAd(merge(base, body));
  const error = validateAd(merged, ad);
  if (error) {
    return badRequest(error);
  }
  Object.assign(ad, merged, { updatedAt: nowKst() });
  saveInstagram();
  return HttpResponse.json(ok(toInstagramAdResponse(ad)), { status: 200 });
});

const deleteAdHandler = http.delete(`${ADS_PATH}/:adId`, ({ params }) => {
  const id = readId(params.adId);
  if (!instagramStore.ads.some((item) => item.id === id)) {
    return HttpResponse.json(notFound('인스타 광고를 찾을 수 없습니다.'), { status: 404 });
  }
  instagramStore.ads = instagramStore.ads.filter((item) => item.id !== id);
  saveInstagram();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

export const instagramAdminHandlers: HttpHandler[] = [
  listAccountsHandler,
  createAccountHandler,
  patchAccountHandler,
  deleteAccountHandler,
  listFormatsHandler,
  createFormatHandler,
  reorderFormatsHandler,
  patchFormatHandler,
  deleteFormatHandler,
  listAdsHandler,
  createAdHandler,
  patchAdHandler,
  deleteAdHandler,
];
