import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  BANNER_PLACEMENTS,
  isSideBannerPlacement,
  type BannerPlacement,
  type AdminBannerRequest,
  type AdminBannerResponse,
  type ReplaceAdminBannerOrderRequest,
} from '../../banners';
import { bannerStore, saveBanners, type BannerRecord } from '../fixtures/banners';
import { notFound, ok } from './paging';

/**
 * 홈 배너 세팅 핸들러(이슈 #573). 백엔드에 넘길 계약(`.claude/tasks/memos/백엔드-요청-배너-세팅-2026-11-06.md`)을
 * 그대로 흉내 낸다.
 *
 * - `GET    /api/v1/admin/banners?placement=` 그 자리의 배너 전부(꺼진 것·기간이 지난 것 포함), 순서대로
 *   `?advertiserId=` 를 주면 그 광고주의 배너만. 자리를 함께 주지 않으면 모든 자리에서 자리 순서·자리 안 순서대로 준다
 * - `POST   /api/v1/admin/banners`            등록. 그 자리의 맨 뒤에 붙는다
 * - `PATCH  /api/v1/admin/banners/{id}`       보낸 칸만 수정. 자리는 바꾸지 않는다
 * - `DELETE /api/v1/admin/banners/{id}`       삭제. 남은 배너의 순서를 1부터 다시 매긴다
 * - `PUT    /api/v1/admin/banners/order`      자리 안 순서를 통째로 바꾼다
 *
 * 저장소는 공개 조회와 같이 쓴다(`../fixtures/banners.ts`). 브라우저에서는 `localStorage` 에도 적는다.
 */

const PATH = '*/api/v1/admin/banners';
const PLACEMENTS: readonly string[] = BANNER_PLACEMENTS;
const PLACEMENT_MESSAGE = `placement: ${BANNER_PLACEMENTS.join(', ')} 중 하나를 보내 주세요.`;
const NAME_MAX_LENGTH = 50;
const ALT_TEXT_MAX_LENGTH = 100;
const URL_MAX_LENGTH = 2048;
/** KST 벽시계 시각. 초까지 적는다. */
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

function nowKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

/** `http(s)://` 주소이거나 `/` 로 시작하는 사이트 안 경로(`//` 는 다른 호스트라 뺀다). */
function isLinkUrl(value: string): boolean {
  if (value.startsWith('/')) {
    return !value.startsWith('//');
  }
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** 이미지 주소는 `https://` 이거나 사용자 웹의 `/banners/` 소재다. 목 업로드가 주는 `data:` 주소도 받는다. */
function isImageUrl(value: string): boolean {
  return (
    value.startsWith('/banners/') || value.startsWith('https://') || value.startsWith('data:image/')
  );
}

/** 칸을 하나씩 본다. 처음 걸린 것 하나만 알린다. `partial` 이면 빠진 칸은 보지 않는다. */
function validate(body: Partial<AdminBannerRequest>, partial: boolean): string | null {
  const has = (key: keyof AdminBannerRequest) => !partial || body[key] !== undefined;

  if (!partial && (typeof body.placement !== 'string' || !PLACEMENTS.includes(body.placement))) {
    return PLACEMENT_MESSAGE;
  }
  if (has('name')) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length === 0 || name.length > NAME_MAX_LENGTH) {
      return `name: 1~${NAME_MAX_LENGTH}자로 보내 주세요.`;
    }
  }
  for (const key of ['pcImageUrl', 'mobileImageUrl'] as const) {
    if (has(key)) {
      const value = body[key];
      // 모바일은 비울 수 있다(`null`). 상세 사이드 자리만 꼭 있어야 하고 그건 합친 결과로 본다(`mobileImageError`).
      if (key === 'mobileImageUrl' && value === null) {
        continue;
      }
      if (typeof value !== 'string' || value.length > URL_MAX_LENGTH || !isImageUrl(value)) {
        return `${key}: https 이미지 주소나 /banners/ 경로를 보내 주세요.`;
      }
    }
  }
  if (has('linkUrl')) {
    if (
      typeof body.linkUrl !== 'string' ||
      body.linkUrl.length > URL_MAX_LENGTH ||
      !isLinkUrl(body.linkUrl)
    ) {
      return 'linkUrl: http(s):// 주소나 / 로 시작하는 경로를 보내 주세요.';
    }
  }
  if (has('altText')) {
    const altText = typeof body.altText === 'string' ? body.altText.trim() : '';
    if (altText.length === 0 || altText.length > ALT_TEXT_MAX_LENGTH) {
      return `altText: 1~${ALT_TEXT_MAX_LENGTH}자로 보내 주세요.`;
    }
  }
  for (const key of ['openInNewTab', 'showAdLabel', 'enabled'] as const) {
    if (has(key) && typeof body[key] !== 'boolean') {
      return `${key}: 참·거짓 값을 보내 주세요.`;
    }
  }
  for (const key of ['startAt', 'endAt'] as const) {
    if (has(key)) {
      const value = body[key];
      if (value !== null && (typeof value !== 'string' || !DATE_TIME.test(value))) {
        return `${key}: null 이거나 YYYY-MM-DDTHH:mm:ss(KST) 로 보내 주세요.`;
      }
    }
  }
  return null;
}

/** 기간 앞뒤. 수정이면 저장된 값과 합친 결과로 본다. */
function periodError(startAt: string | null, endAt: string | null): string | null {
  return startAt !== null && endAt !== null && startAt >= endAt
    ? 'endAt: 노출 끝은 시작보다 뒤여야 합니다.'
    : null;
}

/** 상세 사이드 자리(공고·부트캠프)는 PC 가 세로 소재라 좁은 화면에 그대로 쓸 수 없다. 모바일 이미지가 꼭 있어야 한다. */
function mobileImageError(placement: BannerPlacement, mobileImageUrl: string | null | undefined) {
  return isSideBannerPlacement(placement) && !mobileImageUrl
    ? 'mobileImageUrl: 상세 사이드 배너는 모바일 이미지(750×200)가 있어야 합니다.'
    : null;
}

export function toAdminBannerResponse(banner: BannerRecord): AdminBannerResponse {
  return banner;
}

function inPlacement(placement: string): BannerRecord[] {
  return bannerStore.banners
    .filter((banner) => banner.placement === placement)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** 자리 안 순서를 1부터 빈틈없이 다시 매긴다. 지운 뒤에 쓴다. */
function renumber(placement: string): void {
  inPlacement(placement).forEach((banner, index) => {
    banner.displayOrder = index + 1;
  });
}

function readId(raw: unknown): number {
  const id = Number(raw);
  return Number.isInteger(id) ? id : Number.NaN;
}

const listHandler = http.get(PATH, ({ request }) => {
  const params = new URL(request.url).searchParams;
  const placement = params.get('placement');
  const advertiserParam = params.get('advertiserId');
  const advertiserId = advertiserParam === null ? null : readId(advertiserParam);
  if (advertiserId !== null && Number.isNaN(advertiserId)) {
    return badRequest('advertiserId: 광고주 id 를 숫자로 보내 주세요.');
  }
  if (placement === null ? advertiserId === null : !PLACEMENTS.includes(placement)) {
    return badRequest(PLACEMENT_MESSAGE);
  }
  const banners = (placement === null ? BANNER_PLACEMENTS : [placement])
    .flatMap(inPlacement)
    .filter((banner) => advertiserId === null || banner.advertiserId === advertiserId);
  return HttpResponse.json(ok(banners.map(toAdminBannerResponse)), { status: 200 });
});

const createHandler = http.post(PATH, async ({ request }) => {
  const body = (await request.json().catch(() => null)) as Partial<AdminBannerRequest> | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const error =
    validate(body, false) ??
    periodError(body.startAt ?? null, body.endAt ?? null) ??
    mobileImageError(body.placement as BannerPlacement, body.mobileImageUrl);
  if (error) {
    return badRequest(error);
  }
  const input = body as AdminBannerRequest;
  const now = nowKst();
  const banner: BannerRecord = {
    ...input,
    name: input.name.trim(),
    altText: input.altText.trim(),
    advertiserId: input.advertiserId ?? null,
    mobileImageUrl: input.mobileImageUrl || null,
    contractId: input.contractId ?? null,
    id: Math.max(0, ...bannerStore.banners.map((item) => item.id)) + 1,
    displayOrder: inPlacement(input.placement).length + 1,
    createdAt: now,
    updatedAt: now,
  };
  bannerStore.banners.push(banner);
  saveBanners();
  return HttpResponse.json(
    { ...ok(toAdminBannerResponse(banner)), status: 201, message: 'Created' },
    { status: 201 },
  );
});

// `/order` 가 `:bannerId` 로 잡히지 않게 그보다 앞에 둔다(메서드가 달라 지금은 겹치지 않지만 순서로도 막는다).
const replaceOrderHandler = http.put(`${PATH}/order`, async ({ request }) => {
  const body = (await request.json().catch(() => null)) as ReplaceAdminBannerOrderRequest | null;
  if (body === null || typeof body.placement !== 'string' || !PLACEMENTS.includes(body.placement)) {
    return badRequest(PLACEMENT_MESSAGE);
  }
  const current = inPlacement(body.placement);
  const ids = Array.isArray(body.bannerIds) ? body.bannerIds : [];
  const sameSet =
    ids.length === current.length &&
    new Set(ids).size === ids.length &&
    current.every((banner) => ids.includes(banner.id));
  if (!sameSet) {
    return badRequest('bannerIds: 그 자리의 배너 id 를 빠짐없이 한 번씩 보내 주세요.');
  }
  ids.forEach((id, index) => {
    const banner = current.find((item) => item.id === id);
    if (banner) {
      banner.displayOrder = index + 1;
    }
  });
  saveBanners();
  return HttpResponse.json(ok(inPlacement(body.placement).map(toAdminBannerResponse)), {
    status: 200,
  });
});

const patchHandler = http.patch(`${PATH}/:bannerId`, async ({ params, request }) => {
  const banner = bannerStore.banners.find((item) => item.id === readId(params.bannerId));
  if (!banner) {
    return HttpResponse.json(notFound('배너를 찾을 수 없습니다.'), { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as Partial<AdminBannerRequest> | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  if (body.placement !== undefined && body.placement !== banner.placement) {
    return badRequest('placement: 자리는 바꿀 수 없습니다. 새로 등록해 주세요.');
  }
  const { placement: _placement, ...changes } = body;
  const merged = { ...banner, ...changes };
  const error =
    validate(changes, true) ??
    periodError(merged.startAt, merged.endAt) ??
    mobileImageError(banner.placement, merged.mobileImageUrl);
  if (error) {
    return badRequest(error);
  }
  Object.assign(banner, changes, {
    mobileImageUrl: merged.mobileImageUrl || null,
    contractId: merged.contractId ?? null,
    name: merged.name.trim(),
    altText: merged.altText.trim(),
    updatedAt: nowKst(),
  });
  saveBanners();
  return HttpResponse.json(ok(toAdminBannerResponse(banner)), { status: 200 });
});

const deleteHandler = http.delete(`${PATH}/:bannerId`, ({ params }) => {
  const id = readId(params.bannerId);
  const banner = bannerStore.banners.find((item) => item.id === id);
  if (!banner) {
    return HttpResponse.json(notFound('배너를 찾을 수 없습니다.'), { status: 404 });
  }
  bannerStore.banners = bannerStore.banners.filter((item) => item.id !== id);
  renumber(banner.placement);
  saveBanners();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

export const bannerAdminHandlers: HttpHandler[] = [
  listHandler,
  createHandler,
  replaceOrderHandler,
  patchHandler,
  deleteHandler,
];
