import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  AD_CHANNEL_PLATFORMS,
  CHANNEL_AD_STATUSES,
  type AdChannelPlatform,
  type AdminAdChannelFormatRequest,
  type AdminAdChannelFormatResponse,
  type AdminAdChannelRequest,
  type AdminAdChannelResponse,
  type AdminChannelAdRequest,
  type AdminChannelAdResponse,
} from '../../ad-channels';
import {
  adContractLinkError,
  adContractStore,
  adContractSummary,
  saveAdContracts,
} from '../fixtures/ad-contracts';
import { advertiserSummary, findAdvertiser } from '../fixtures/advertisers';
import {
  adChannelStore,
  saveAdChannels,
  type AdChannelFormatRecord,
  type AdChannelRecord,
  type ChannelAdRecord,
} from '../fixtures/ad-channels';
import { notFound, ok } from './paging';

/**
 * 채널 광고 핸들러(이슈 #573). 계약은 `.claude/tasks/memos/백엔드-요청-채널-광고-2026-11-06.md`.
 *
 * - `GET/POST     /api/v1/admin/ad-channels`                   채널 목록(등록 순)·등록
 * - `PATCH/DELETE /api/v1/admin/ad-channels/{id}`              수정·삭제. 광고가 잡힌 채널은 지울 수 없다(400)
 * - `GET/POST     /api/v1/admin/ad-channel-formats`            게재 유형 목록(플랫폼, 순서대로)·등록(그 플랫폼 맨 뒤)
 * - `PUT          /api/v1/admin/ad-channel-formats/order`      `{ platform, formatIds }` 로 한 플랫폼의 순서를 통째로 바꾼다
 * - `PATCH/DELETE /api/v1/admin/ad-channel-formats/{id}`       수정·삭제. 광고가 잡힌 유형은 지울 수 없다(400)
 * - `GET/POST     /api/v1/admin/channel-ads`                   채널 광고 목록(거르기)·등록
 * - `PATCH/DELETE /api/v1/admin/channel-ads/{id}`              보낸 칸만 수정·삭제
 */

const CHANNELS_PATH = '*/api/v1/admin/ad-channels';
const FORMATS_PATH = '*/api/v1/admin/ad-channel-formats';
const ADS_PATH = '*/api/v1/admin/channel-ads';
const HANDLE = /^[A-Za-z0-9._]{1,30}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;
const URL_PATTERN = /^https?:\/\/\S+$/;
const IMAGE_URL = /^(https?:\/\/\S+|\/\S*)$/;
const NAME_MAX_LENGTH = 50;
const TEXT_MAX_LENGTH = 500;
const MEMO_MAX_LENGTH = 1000;
const PRICE_MAX = 9_999_999_999;
const MEMBER_MAX = 99_999_999;

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

const isPlatform = (value: unknown): value is AdChannelPlatform =>
  AD_CHANNEL_PLATFORMS.includes(value as AdChannelPlatform);

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

const channelLabel = (channel: AdChannelRecord) =>
  channel.handle ? `@${channel.handle}` : channel.name;

// ---------------------------------------------------------------- 채널

function toChannelResponse(channel: AdChannelRecord): AdminAdChannelResponse {
  return {
    ...channel,
    adCount: adChannelStore.ads.filter((ad) => ad.channelId === channel.id).length,
  };
}

function normalizeChannel(input: AdminAdChannelRequest): AdminAdChannelRequest {
  const handle = typeof input.handle === 'string' ? input.handle.trim().replace(/^@/, '') : '';
  return {
    platform: input.platform,
    name: typeof input.name === 'string' ? input.name.trim() : '',
    // 오픈채팅방은 계정 이름이 없다.
    handle: input.platform === 'INSTAGRAM' ? handle : null,
    url: typeof input.url === 'string' ? input.url.trim() : '',
    profileImageUrl: trimmedOrNull(input.profileImageUrl),
    memberCount: input.memberCount,
    enabled: input.enabled,
    memo: trimmedOrNull(input.memo),
  };
}

function validateChannel(channel: AdminAdChannelRequest, selfId: number | null) {
  if (!isPlatform(channel.platform)) {
    return `platform: ${AD_CHANNEL_PLATFORMS.join(', ')} 가운데 하나로 보내 주세요.`;
  }
  if (channel.platform === 'INSTAGRAM') {
    const handle = channel.handle ?? '';
    if (!HANDLE.test(handle)) {
      return 'handle: 영문·숫자·마침표·밑줄 30자까지로 보내 주세요(`@` 는 빼도 됩니다).';
    }
    if (
      adChannelStore.channels.some(
        (item) => item.id !== selfId && item.handle?.toLowerCase() === handle.toLowerCase(),
      )
    ) {
      return 'handle: 이미 등록된 계정입니다.';
    }
  }
  if (!channel.name || channel.name.length > NAME_MAX_LENGTH) {
    return `name: 1~${NAME_MAX_LENGTH}자로 보내 주세요.`;
  }
  if (!URL_PATTERN.test(channel.url)) {
    return 'url: http:// 또는 https:// 로 시작하는 주소를 보내 주세요.';
  }
  if (channel.profileImageUrl !== null && !IMAGE_URL.test(channel.profileImageUrl)) {
    return 'profileImageUrl: null 이거나 https:// 주소, / 로 시작하는 경로로 보내 주세요.';
  }
  if (
    channel.memberCount !== null &&
    (!Number.isInteger(channel.memberCount) ||
      channel.memberCount < 0 ||
      channel.memberCount > MEMBER_MAX)
  ) {
    return 'memberCount: null 이거나 0 이상의 정수로 보내 주세요.';
  }
  if (typeof channel.enabled !== 'boolean') {
    return 'enabled: 참·거짓 값을 보내 주세요.';
  }
  if (channel.memo !== null && channel.memo.length > TEXT_MAX_LENGTH) {
    return `memo: ${TEXT_MAX_LENGTH}자까지 보낼 수 있습니다.`;
  }
  return null;
}

const listChannelsHandler = http.get(CHANNELS_PATH, () =>
  HttpResponse.json(ok(adChannelStore.channels.map(toChannelResponse)), { status: 200 }),
);

const createChannelHandler = http.post(CHANNELS_PATH, async ({ request }) => {
  const body = await readBody<AdminAdChannelRequest>(request);
  if (!body) {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const input = normalizeChannel({
    platform: body.platform as AdChannelPlatform,
    name: body.name ?? '',
    handle: body.handle ?? null,
    url: body.url ?? '',
    profileImageUrl: body.profileImageUrl ?? null,
    memberCount: body.memberCount ?? null,
    enabled: body.enabled ?? true,
    memo: body.memo ?? null,
  });
  const error = validateChannel(input, null);
  if (error) {
    return badRequest(error);
  }
  const now = nowKst();
  const channel: AdChannelRecord = {
    ...input,
    id: nextId(adChannelStore.channels),
    createdAt: now,
    updatedAt: now,
  };
  adChannelStore.channels.push(channel);
  saveAdChannels();
  return HttpResponse.json(
    { ...ok(toChannelResponse(channel)), status: 201, message: 'Created' },
    { status: 201 },
  );
});

const patchChannelHandler = http.patch(
  `${CHANNELS_PATH}/:channelId`,
  async ({ params, request }) => {
    const channel = adChannelStore.channels.find((item) => item.id === readId(params.channelId));
    if (!channel) {
      return HttpResponse.json(notFound('채널을 찾을 수 없습니다.'), { status: 404 });
    }
    const body = await readBody<AdminAdChannelRequest>(request);
    if (!body) {
      return badRequest('본문을 JSON 으로 보내 주세요.');
    }
    if (body.platform !== undefined && body.platform !== channel.platform) {
      return badRequest('platform: 등록한 뒤에는 바꿀 수 없습니다.');
    }
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...current } = channel;
    const merged = normalizeChannel(merge(current, body));
    const error = validateChannel(merged, channel.id);
    if (error) {
      return badRequest(error);
    }
    Object.assign(channel, merged, { updatedAt: nowKst() });
    saveAdChannels();
    return HttpResponse.json(ok(toChannelResponse(channel)), { status: 200 });
  },
);

const deleteChannelHandler = http.delete(`${CHANNELS_PATH}/:channelId`, ({ params }) => {
  const id = readId(params.channelId);
  if (!adChannelStore.channels.some((item) => item.id === id)) {
    return HttpResponse.json(notFound('채널을 찾을 수 없습니다.'), { status: 404 });
  }
  if (adChannelStore.ads.some((ad) => ad.channelId === id)) {
    return badRequest(
      '이 채널에 잡힌 채널 광고가 있어 지울 수 없습니다. 사용 안 함으로 바꿔 주세요.',
    );
  }
  adChannelStore.channels = adChannelStore.channels.filter((item) => item.id !== id);
  for (const format of adChannelStore.formats) {
    format.channelIds = format.channelIds.filter((channelId) => channelId !== id);
  }
  saveAdChannels();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

// ---------------------------------------------------------------- 게재 유형

function toFormatResponse(format: AdChannelFormatRecord): AdminAdChannelFormatResponse {
  return {
    ...format,
    adCount: adChannelStore.ads.filter((ad) => ad.formatId === format.id).length,
  };
}

/** 플랫폼 순(`AD_CHANNEL_PLATFORMS`), 그 안에서 `displayOrder` 순. */
const sortedFormats = () =>
  [...adChannelStore.formats].sort(
    (a, b) =>
      AD_CHANNEL_PLATFORMS.indexOf(a.platform) - AD_CHANNEL_PLATFORMS.indexOf(b.platform) ||
      a.displayOrder - b.displayOrder,
  );

const platformFormats = (platform: AdChannelPlatform) =>
  sortedFormats().filter((format) => format.platform === platform);

function normalizeFormat(input: AdminAdChannelFormatRequest): AdminAdChannelFormatRequest {
  return {
    platform: input.platform,
    name: typeof input.name === 'string' ? input.name.trim() : '',
    description: trimmedOrNull(input.description),
    enabled: input.enabled,
    defaultPrice: input.defaultPrice,
    // 채널 등록 순으로 둔다. 다른 플랫폼의 채널은 검사에서 걸러 400 이다.
    channelIds: Array.isArray(input.channelIds)
      ? [
          ...adChannelStore.channels
            .map((channel) => channel.id)
            .filter((id) => input.channelIds.includes(id)),
          ...input.channelIds.filter(
            (id) => !adChannelStore.channels.some((channel) => channel.id === id),
          ),
        ]
      : input.channelIds,
  };
}

function validateFormat(format: AdminAdChannelFormatRequest, selfId: number | null) {
  if (!isPlatform(format.platform)) {
    return `platform: ${AD_CHANNEL_PLATFORMS.join(', ')} 가운데 하나로 보내 주세요.`;
  }
  if (!format.name || format.name.length > NAME_MAX_LENGTH) {
    return `name: 1~${NAME_MAX_LENGTH}자로 보내 주세요.`;
  }
  if (
    adChannelStore.formats.some(
      (item) =>
        item.id !== selfId && item.platform === format.platform && item.name === format.name,
    )
  ) {
    return 'name: 같은 플랫폼에 같은 이름의 게재 유형이 있습니다.';
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
  if (!Array.isArray(format.channelIds)) {
    return 'channelIds: 채널 id 배열로 보내 주세요. 비우면 그 플랫폼의 모든 채널입니다.';
  }
  if (
    format.channelIds.some(
      (id) =>
        adChannelStore.channels.find((channel) => channel.id === id)?.platform !== format.platform,
    )
  ) {
    return 'channelIds: 같은 플랫폼에 있는 채널 id 만 보내 주세요.';
  }
  return null;
}

const listFormatsHandler = http.get(FORMATS_PATH, () =>
  HttpResponse.json(ok(sortedFormats().map(toFormatResponse)), { status: 200 }),
);

const createFormatHandler = http.post(FORMATS_PATH, async ({ request }) => {
  const body = await readBody<AdminAdChannelFormatRequest>(request);
  if (!body) {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const input = normalizeFormat({
    platform: body.platform as AdChannelPlatform,
    name: body.name ?? '',
    description: body.description ?? null,
    enabled: body.enabled ?? true,
    defaultPrice: body.defaultPrice ?? null,
    channelIds: body.channelIds ?? [],
  });
  const error = validateFormat(input, null);
  if (error) {
    return badRequest(error);
  }
  const now = nowKst();
  const format: AdChannelFormatRecord = {
    ...input,
    id: nextId(adChannelStore.formats),
    displayOrder:
      Math.max(0, ...platformFormats(input.platform).map((item) => item.displayOrder)) + 1,
    createdAt: now,
    updatedAt: now,
  };
  adChannelStore.formats.push(format);
  saveAdChannels();
  return HttpResponse.json(
    { ...ok(toFormatResponse(format)), status: 201, message: 'Created' },
    { status: 201 },
  );
});

// `/:formatId` 보다 앞에 둔다. 뒤에 두면 `order` 를 id 로 읽는다.
const reorderFormatsHandler = http.put(`${FORMATS_PATH}/order`, async ({ request }) => {
  const body = await readBody<{ platform: AdChannelPlatform; formatIds: number[] }>(request);
  const platform = body?.platform;
  if (!isPlatform(platform)) {
    return badRequest(`platform: ${AD_CHANNEL_PLATFORMS.join(', ')} 가운데 하나로 보내 주세요.`);
  }
  const ids = body?.formatIds;
  const current = platformFormats(platform).map((format) => format.id);
  if (
    !Array.isArray(ids) ||
    ids.length !== current.length ||
    new Set(ids).size !== ids.length ||
    !current.every((id) => ids.includes(id))
  ) {
    return badRequest('formatIds: 그 플랫폼의 게재 유형 id 를 빠짐없이, 겹치지 않게 보내 주세요.');
  }
  ids.forEach((id, index) => {
    const format = adChannelStore.formats.find((item) => item.id === id);
    if (format) format.displayOrder = index + 1;
  });
  saveAdChannels();
  return HttpResponse.json(ok(sortedFormats().map(toFormatResponse)), { status: 200 });
});

const patchFormatHandler = http.patch(`${FORMATS_PATH}/:formatId`, async ({ params, request }) => {
  const format = adChannelStore.formats.find((item) => item.id === readId(params.formatId));
  if (!format) {
    return HttpResponse.json(notFound('게재 유형을 찾을 수 없습니다.'), { status: 404 });
  }
  const body = await readBody<AdminAdChannelFormatRequest>(request);
  if (!body) {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  if (body.platform !== undefined && body.platform !== format.platform) {
    return badRequest('platform: 등록한 뒤에는 바꿀 수 없습니다.');
  }
  const { platform, name, description, enabled, defaultPrice, channelIds } = format;
  const merged = normalizeFormat(
    merge({ platform, name, description, enabled, defaultPrice, channelIds }, body),
  );
  const error = validateFormat(merged, format.id);
  if (error) {
    return badRequest(error);
  }
  Object.assign(format, merged, { updatedAt: nowKst() });
  saveAdChannels();
  return HttpResponse.json(ok(toFormatResponse(format)), { status: 200 });
});

const deleteFormatHandler = http.delete(`${FORMATS_PATH}/:formatId`, ({ params }) => {
  const id = readId(params.formatId);
  const target = adChannelStore.formats.find((item) => item.id === id);
  if (!target) {
    return HttpResponse.json(notFound('게재 유형을 찾을 수 없습니다.'), { status: 404 });
  }
  if (adChannelStore.ads.some((ad) => ad.formatId === id)) {
    return badRequest(
      '이 유형으로 잡힌 채널 광고가 있어 지울 수 없습니다. 사용 안 함으로 바꿔 주세요.',
    );
  }
  adChannelStore.formats = adChannelStore.formats.filter((item) => item.id !== id);
  // 같은 플랫폼의 남은 순서를 1부터 다시 매긴다.
  platformFormats(target.platform).forEach((format, index) => {
    format.displayOrder = index + 1;
  });
  // 이 유형을 산 계약에서도 뺀다.
  for (const contract of adContractStore.contracts) {
    contract.channelFormatIds = contract.channelFormatIds.filter((formatId) => formatId !== id);
  }
  saveAdChannels();
  saveAdContracts();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

// ---------------------------------------------------------------- 채널 광고

export function toChannelAdResponse(ad: ChannelAdRecord): AdminChannelAdResponse {
  const channel = adChannelStore.channels.find((item) => item.id === ad.channelId);
  const format = adChannelStore.formats.find((item) => item.id === ad.formatId);
  return {
    ...ad,
    advertiser: advertiserSummary(ad.advertiserId),
    contract: adContractSummary(ad.contractId),
    platform: channel?.platform ?? format?.platform ?? 'INSTAGRAM',
    channel: channel
      ? { id: channel.id, platform: channel.platform, name: channel.name, handle: channel.handle }
      : null,
    format: format ? { id: format.id, platform: format.platform, name: format.name } : null,
  };
}

/** 채널 광고가 차지하는 날 `[postDate, endDate ?? postDate]`(둘 다 포함)이 `[from, toExclusive)` 와 겹치는가. */
export function channelAdOverlaps(ad: ChannelAdRecord, from: string, toExclusive: string) {
  return ad.postDate < toExclusive && (ad.endDate ?? ad.postDate) >= from;
}

/** 다음 달 1일. `2026-12` → `2027-01-01`. */
function nextMonthStart(month: string): string {
  const [year, value] = month.split('-').map(Number) as [number, number];
  return value === 12 ? `${year + 1}-01-01` : `${year}-${String(value + 1).padStart(2, '0')}-01`;
}

function normalizeAd(input: AdminChannelAdRequest): AdminChannelAdRequest {
  return {
    ...input,
    postUrl: trimmedOrNull(input.postUrl),
    creativeMemo: trimmedOrNull(input.creativeMemo),
    adminMemo: trimmedOrNull(input.adminMemo),
  };
}

function validateAd(ad: AdminChannelAdRequest, previous: ChannelAdRecord | null) {
  if (!findAdvertiser(ad.advertiserId)) {
    return 'advertiserId: 있는 광고주를 골라 주세요.';
  }
  const contractError = adContractLinkError(ad.contractId, ad.advertiserId);
  if (contractError) {
    return contractError;
  }
  const channel = adChannelStore.channels.find((item) => item.id === ad.channelId);
  if (!channel) {
    return 'channelId: 있는 채널을 골라 주세요.';
  }
  // 끈 채널·유형은 새로 고를 수 없다. 이미 그 값으로 잡힌 광고는 그대로 둘 수 있다.
  if (!channel.enabled && previous?.channelId !== channel.id) {
    return 'channelId: 사용 안 함인 채널은 고를 수 없습니다.';
  }
  const format = adChannelStore.formats.find((item) => item.id === ad.formatId);
  if (!format) {
    return 'formatId: 있는 게재 유형을 골라 주세요.';
  }
  if (!format.enabled && previous?.formatId !== format.id) {
    return 'formatId: 사용 안 함인 게재 유형은 고를 수 없습니다.';
  }
  if (format.platform !== channel.platform) {
    return 'formatId: 채널과 같은 플랫폼의 게재 유형을 골라 주세요.';
  }
  if (format.channelIds.length > 0 && !format.channelIds.includes(channel.id)) {
    return `formatId: ${channelLabel(channel)} 에는 ${format.name} 을(를) 올리지 않습니다.`;
  }
  if (typeof ad.postDate !== 'string' || !DATE.test(ad.postDate)) {
    return 'postDate: YYYY-MM-DD(KST) 로 보내 주세요.';
  }
  if (ad.endDate !== null && (!DATE.test(ad.endDate) || ad.endDate < ad.postDate)) {
    return 'endDate: null 이거나 게시 예정일과 같거나 뒤인 YYYY-MM-DD 로 보내 주세요.';
  }
  if (!CHANNEL_AD_STATUSES.includes(ad.status)) {
    return `status: ${CHANNEL_AD_STATUSES.join(', ')} 가운데 하나로 보내 주세요.`;
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
  const channelId = numberParam('channelId');
  const formatId = numberParam('formatId');
  const platform = params.get('platform') ?? '';
  const status = params.get('status') ?? '';
  const ads = adChannelStore.ads
    .map(toChannelAdResponse)
    .filter(
      (ad) =>
        (!month || channelAdOverlaps(ad, `${month}-01`, nextMonthStart(month))) &&
        (advertiserId === null || ad.advertiserId === advertiserId) &&
        (contractId === null || ad.contractId === contractId) &&
        (!platform || ad.platform === platform) &&
        (channelId === null || ad.channelId === channelId) &&
        (formatId === null || ad.formatId === formatId) &&
        (!status || ad.status === status),
    )
    .sort((a, b) => (a.postDate === b.postDate ? a.id - b.id : a.postDate < b.postDate ? -1 : 1));
  return HttpResponse.json(ok(ads), { status: 200 });
});

const createAdHandler = http.post(ADS_PATH, async ({ request }) => {
  const body = await readBody<AdminChannelAdRequest>(request);
  if (!body) {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const input = normalizeAd({
    advertiserId: body.advertiserId as number,
    contractId: body.contractId ?? null,
    channelId: body.channelId as number,
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
  const ad: ChannelAdRecord = {
    ...input,
    id: nextId(adChannelStore.ads),
    createdAt: now,
    updatedAt: now,
  };
  adChannelStore.ads.push(ad);
  saveAdChannels();
  return HttpResponse.json(
    { ...ok(toChannelAdResponse(ad)), status: 201, message: 'Created' },
    { status: 201 },
  );
});

const patchAdHandler = http.patch(`${ADS_PATH}/:adId`, async ({ params, request }) => {
  const ad = adChannelStore.ads.find((item) => item.id === readId(params.adId));
  if (!ad) {
    return HttpResponse.json(notFound('채널 광고를 찾을 수 없습니다.'), { status: 404 });
  }
  const body = await readBody<AdminChannelAdRequest>(request);
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
  saveAdChannels();
  return HttpResponse.json(ok(toChannelAdResponse(ad)), { status: 200 });
});

const deleteAdHandler = http.delete(`${ADS_PATH}/:adId`, ({ params }) => {
  const id = readId(params.adId);
  if (!adChannelStore.ads.some((item) => item.id === id)) {
    return HttpResponse.json(notFound('채널 광고를 찾을 수 없습니다.'), { status: 404 });
  }
  adChannelStore.ads = adChannelStore.ads.filter((item) => item.id !== id);
  saveAdChannels();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

export const adChannelAdminHandlers: HttpHandler[] = [
  listChannelsHandler,
  createChannelHandler,
  patchChannelHandler,
  deleteChannelHandler,
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
