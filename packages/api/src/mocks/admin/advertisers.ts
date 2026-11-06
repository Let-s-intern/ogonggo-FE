import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminAdvertiserResponse,
  CreateAdminAdvertiserRequest,
  UpdateAdminAdvertiserRequest,
} from '../../advertisers';
import { adContractStore, isAdContractActive } from '../fixtures/ad-contracts';
import { adPostingStore, isAdPostingLive } from '../fixtures/ad-postings';
import {
  allAdvertisers,
  findAdvertiser,
  nonMemberAdvertiserStore,
  saveAdvertisers,
  type AdvertiserRecord,
} from '../fixtures/advertisers';
import { bannerStore, isBannerLive } from '../fixtures/banners';
import { toAdminAdPostingResponse } from './ad-postings';
import { notFound, ok } from './paging';

/**
 * 광고주 핸들러(이슈 #573). 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 의 "광고주".
 *
 * - `GET   /api/v1/admin/advertisers?keyword=&type=` 비즈니스 회원·광고 문의 기업·직접 추가한 기업을 합친 목록.
 *   `keyword` 는 이름·담당자 이름·메일 부분 일치(대소문자 무시), `type` 은 `MEMBER`·`NON_MEMBER`. 페이지 없이 최대 50건
 * - `GET   /api/v1/admin/advertisers/{id}`          한 건
 * - `POST  /api/v1/admin/advertisers`               비회원 광고주 추가. 같은 이름(공백·대소문자 무시)이 있으면 400
 * - `PATCH /api/v1/admin/advertisers/{id}`          비회원 광고주 수정. 회원 광고주는 400
 *
 * 응답마다 그 광고주의 배너·광고 공고 수(`AdvertiserAdCounts`)와 계약 합계(`AdvertiserContractTotals`)를 저장소에서 세어
 * 붙인다.
 */

const PATH = '*/api/v1/admin/advertisers';
const LIST_LIMIT = 50;
const NAME_MAX_LENGTH = 50;
const MEMO_MAX_LENGTH = 500;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase();

function readId(raw: unknown): number {
  const id = Number(raw);
  return Number.isInteger(id) ? id : Number.NaN;
}

/** 저장된 광고주에 배너·광고 공고 수를 붙인다. 노출 중은 각 표의 `노출 중` 과 같은 규칙으로 센다. */
function toResponse(advertiser: AdvertiserRecord): AdminAdvertiserResponse {
  const banners = bannerStore.banners.filter((banner) => banner.advertiserId === advertiser.id);
  const ads = adPostingStore.adPostings.filter((ad) => ad.advertiserId === advertiser.id);
  const endAts = [...banners, ...ads].flatMap((item) => (item.endAt === null ? [] : [item.endAt]));
  const contracts = adContractStore.contracts.filter(
    (contract) => contract.advertiserId === advertiser.id,
  );
  return {
    ...advertiser,
    bannerCount: banners.length,
    activeBannerCount: banners.filter((banner) => isBannerLive(banner)).length,
    adPostingCount: ads.length,
    activeAdPostingCount: ads.filter(
      (ad) => isAdPostingLive(ad) && toAdminAdPostingResponse(ad).targetAvailable,
    ).length,
    latestEndAt: endAts.length === 0 ? null : endAts.reduce((a, b) => (a > b ? a : b)),
    contractCount: contracts.length,
    activeContractCount: contracts.filter((contract) => isAdContractActive(contract)).length,
    contractTotalAmount: contracts.reduce((sum, contract) => sum + contract.amount, 0),
  };
}

/** 칸 하나를 다듬는다. 빈 문자열은 지운 것이다. */
const optional = (value: string | undefined) => value?.trim() || undefined;

const listHandler = http.get(PATH, ({ request }) => {
  const params = new URL(request.url).searchParams;
  const keyword = (params.get('keyword') ?? '').trim().toLowerCase();
  const type = params.get('type') ?? '';
  if (type !== '' && type !== 'MEMBER' && type !== 'NON_MEMBER') {
    return badRequest('type: MEMBER, NON_MEMBER 중 하나를 보내 주세요.');
  }
  const matches = allAdvertisers().filter(
    (advertiser) =>
      (type === '' || advertiser.type === type) &&
      (!keyword ||
        [advertiser.name, advertiser.contactName, advertiser.contactEmail].some((text) =>
          text?.toLowerCase().includes(keyword),
        )),
  );
  return HttpResponse.json(ok(matches.slice(0, LIST_LIMIT).map(toResponse)), { status: 200 });
});

const detailHandler = http.get(`${PATH}/:advertiserId`, ({ params }) => {
  const advertiser = findAdvertiser(readId(params.advertiserId));
  if (!advertiser) {
    return HttpResponse.json(notFound('광고주를 찾을 수 없습니다.'), { status: 404 });
  }
  return HttpResponse.json(ok(toResponse(advertiser)), { status: 200 });
});

const createHandler = http.post(PATH, async ({ request }) => {
  const body = (await request
    .json()
    .catch(() => null)) as Partial<CreateAdminAdvertiserRequest> | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length === 0 || name.length > NAME_MAX_LENGTH) {
    return badRequest(`name: 1~${NAME_MAX_LENGTH}자로 보내 주세요.`);
  }
  if (allAdvertisers().some((advertiser) => normalize(advertiser.name) === normalize(name))) {
    return badRequest('name: 같은 이름의 광고주가 이미 있습니다. 목록에서 골라 주세요.');
  }
  const contactEmail = body.contactEmail?.trim() || undefined;
  if (contactEmail && !EMAIL.test(contactEmail)) {
    return badRequest('contactEmail: 메일 주소 형식으로 보내 주세요.');
  }
  const memo = body.memo?.trim() || undefined;
  if (memo && memo.length > MEMO_MAX_LENGTH) {
    return badRequest(`memo: ${MEMO_MAX_LENGTH}자까지 보낼 수 있습니다.`);
  }
  const advertiser: AdvertiserRecord = {
    id: Math.max(0, ...nonMemberAdvertiserStore.advertisers.map((item) => item.id)) + 1,
    name,
    type: 'NON_MEMBER',
    source: 'MANUAL',
    contactName: optional(body.contactName),
    contactEmail,
    contactPhone: optional(body.contactPhone),
    memo,
  };
  nonMemberAdvertiserStore.advertisers.push(advertiser);
  saveAdvertisers();
  return HttpResponse.json(
    { ...ok(toResponse(advertiser)), status: 201, message: 'Created' },
    { status: 201 },
  );
});

const patchHandler = http.patch(`${PATH}/:advertiserId`, async ({ params, request }) => {
  const id = readId(params.advertiserId);
  const found = findAdvertiser(id);
  if (!found) {
    return HttpResponse.json(notFound('광고주를 찾을 수 없습니다.'), { status: 404 });
  }
  const advertiser = nonMemberAdvertiserStore.advertisers.find((item) => item.id === id);
  if (!advertiser) {
    return badRequest('회원 광고주는 비즈니스 회원 정보를 따릅니다. 회원 정보에서 바꿔 주세요.');
  }
  const body = (await request.json().catch(() => null)) as UpdateAdminAdvertiserRequest | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  // 칸을 모두 본 뒤에 한꺼번에 바꾼다. 중간에 걸리면 아무것도 바뀌지 않는다.
  const changes: Partial<AdvertiserRecord> = {};
  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length === 0 || name.length > NAME_MAX_LENGTH) {
      return badRequest(`name: 1~${NAME_MAX_LENGTH}자로 보내 주세요.`);
    }
    if (
      allAdvertisers().some((other) => other.id !== id && normalize(other.name) === normalize(name))
    ) {
      return badRequest('name: 같은 이름의 광고주가 이미 있습니다.');
    }
    changes.name = name;
  }
  if (body.contactEmail !== undefined) {
    const contactEmail = optional(body.contactEmail);
    if (contactEmail && !EMAIL.test(contactEmail)) {
      return badRequest('contactEmail: 메일 주소 형식으로 보내 주세요.');
    }
    changes.contactEmail = contactEmail;
  }
  if (body.memo !== undefined) {
    const memo = optional(body.memo);
    if (memo && memo.length > MEMO_MAX_LENGTH) {
      return badRequest(`memo: ${MEMO_MAX_LENGTH}자까지 보낼 수 있습니다.`);
    }
    changes.memo = memo;
  }
  if (body.contactName !== undefined) {
    changes.contactName = optional(body.contactName);
  }
  if (body.contactPhone !== undefined) {
    changes.contactPhone = optional(body.contactPhone);
  }
  Object.assign(advertiser, changes);
  saveAdvertisers();
  return HttpResponse.json(ok(toResponse(advertiser)), { status: 200 });
});

export const advertiserAdminHandlers: HttpHandler[] = [
  listHandler,
  detailHandler,
  createHandler,
  patchHandler,
];
