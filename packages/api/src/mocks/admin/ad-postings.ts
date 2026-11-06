import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  AD_POSTING_PLACEMENTS,
  adPostingTargetType,
  type AdPostingPlacement,
  type AdminAdPostingResponse,
  type CreateAdminAdPostingRequest,
  type ReplaceAdminAdPostingOrderRequest,
  type UpdateAdminAdPostingRequest,
} from '../../ad-postings';
import { ADMIN_BOOTCAMP_FIXTURES, ADMIN_JOB_FIXTURES } from '../fixtures/admin-content';
import {
  adPostingStore,
  adPostingsIn,
  saveAdPostings,
  type AdPostingRecord,
} from '../fixtures/ad-postings';
import { advertiserSummary, findAdvertiser } from '../fixtures/advertisers';
import { notFound, ok } from './paging';

/**
 * 광고 공고 세팅 핸들러(이슈 #573). 백엔드에 넘길 계약(`.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md`)을
 * 그대로 흉내 낸다. 배너 세팅(`./banners.ts`)과 같은 모양이다.
 *
 * - `GET    /api/v1/admin/ad-postings?placement=` 그 자리의 광고 전부(꺼진 것·기간이 지난 것 포함), 순서대로
 * - `POST   /api/v1/admin/ad-postings`            등록. 그 자리의 맨 뒤에 붙는다. 같은 자리에 같은 대상은 한 번만
 * - `PATCH  /api/v1/admin/ad-postings/{id}`       광고주·기간·켜기만 수정
 * - `DELETE /api/v1/admin/ad-postings/{id}`       삭제. 남은 광고의 순서를 1부터 다시 매긴다
 * - `PUT    /api/v1/admin/ad-postings/order`      자리 안 순서를 통째로 바꾼다
 */

const PATH = '*/api/v1/admin/ad-postings';
const PLACEMENTS: readonly string[] = AD_POSTING_PLACEMENTS;
const PLACEMENT_MESSAGE = `placement: ${AD_POSTING_PLACEMENTS.join(', ')} 중 하나를 보내 주세요.`;
/** KST 벽시계 시각. 초까지 적는다. */
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

function nowKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

/** 저장된 광고에 대상의 제목·회사·노출 가능 여부를 붙인다. 대상이 없으면 빈 칸이고 나갈 수 없다. */
function toResponse(record: AdPostingRecord): AdminAdPostingResponse {
  const ad = { ...record, advertiser: advertiserSummary(record.advertiserId) };
  const targetType = adPostingTargetType(ad.placement);
  if (targetType === 'BOOTCAMP') {
    const bootcamp = ADMIN_BOOTCAMP_FIXTURES.find((item) => item.id === ad.targetId);
    return {
      ...ad,
      targetType,
      targetTitle: bootcamp?.title ?? '',
      targetCompanyName: bootcamp?.companyName ?? '',
      targetAvailable: bootcamp?.visibility === 'VISIBLE' && bootcamp.status === 'RECRUITING',
    };
  }
  const job = ADMIN_JOB_FIXTURES.find((item) => item.id === ad.targetId);
  return {
    ...ad,
    targetType,
    targetTitle: job?.title ?? '',
    targetCompanyName: job?.companyName ?? '',
    targetAvailable: job?.visibility === 'VISIBLE' && job.recruitmentStatus !== 'CLOSED',
  };
}

function targetExists(placement: AdPostingPlacement, targetId: number): boolean {
  const fixtures =
    adPostingTargetType(placement) === 'BOOTCAMP' ? ADMIN_BOOTCAMP_FIXTURES : ADMIN_JOB_FIXTURES;
  return fixtures.some((item) => item.id === targetId);
}

/** 기간 칸 하나. `null` 이거나 KST 벽시계 시각이다. */
function periodValueError(key: 'startAt' | 'endAt', value: unknown): string | null {
  return value !== null && (typeof value !== 'string' || !DATE_TIME.test(value))
    ? `${key}: null 이거나 YYYY-MM-DDTHH:mm:ss(KST) 로 보내 주세요.`
    : null;
}

/** 기간 앞뒤. 수정이면 저장된 값과 합친 결과로 본다. */
function periodError(startAt: string | null, endAt: string | null): string | null {
  return startAt !== null && endAt !== null && startAt >= endAt
    ? 'endAt: 노출 끝은 시작보다 뒤여야 합니다.'
    : null;
}

function renumber(placement: string): void {
  adPostingsIn(placement).forEach((ad, index) => {
    ad.displayOrder = index + 1;
  });
}

function readId(raw: unknown): number {
  const id = Number(raw);
  return Number.isInteger(id) ? id : Number.NaN;
}

const listHandler = http.get(PATH, ({ request }) => {
  const placement = new URL(request.url).searchParams.get('placement');
  if (placement === null || !PLACEMENTS.includes(placement)) {
    return badRequest(PLACEMENT_MESSAGE);
  }
  return HttpResponse.json(ok(adPostingsIn(placement).map(toResponse)), { status: 200 });
});

const createHandler = http.post(PATH, async ({ request }) => {
  const body = (await request
    .json()
    .catch(() => null)) as Partial<CreateAdminAdPostingRequest> | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  if (typeof body.placement !== 'string' || !PLACEMENTS.includes(body.placement)) {
    return badRequest(PLACEMENT_MESSAGE);
  }
  const placement = body.placement;
  const targetId = Number(body.targetId);
  if (!Number.isInteger(targetId) || !targetExists(placement, targetId)) {
    return badRequest(
      adPostingTargetType(placement) === 'BOOTCAMP'
        ? 'targetId: 있는 부트캠프 id 를 보내 주세요.'
        : 'targetId: 있는 채용공고 id 를 보내 주세요.',
    );
  }
  if (adPostingsIn(placement).some((ad) => ad.targetId === targetId)) {
    return badRequest('targetId: 이 자리에 이미 등록된 대상입니다.');
  }
  if (!findAdvertiser(body.advertiserId)) {
    return badRequest('advertiserId: 광고주를 골라 주세요.');
  }
  const advertiserId = Number(body.advertiserId);
  if (typeof body.enabled !== 'boolean') {
    return badRequest('enabled: 참·거짓 값을 보내 주세요.');
  }
  const startAt = body.startAt ?? null;
  const endAt = body.endAt ?? null;
  const error =
    periodValueError('startAt', startAt) ??
    periodValueError('endAt', endAt) ??
    periodError(startAt, endAt);
  if (error) {
    return badRequest(error);
  }
  const now = nowKst();
  const ad: AdPostingRecord = {
    id: Math.max(0, ...adPostingStore.adPostings.map((item) => item.id)) + 1,
    placement,
    targetId,
    advertiserId,
    startAt,
    endAt,
    enabled: body.enabled,
    displayOrder: adPostingsIn(placement).length + 1,
    createdAt: now,
    updatedAt: now,
  };
  adPostingStore.adPostings.push(ad);
  saveAdPostings();
  return HttpResponse.json(
    { ...ok(toResponse(ad)), status: 201, message: 'Created' },
    { status: 201 },
  );
});

// `/order` 가 `:adPostingId` 로 잡히지 않게 그보다 앞에 둔다.
const replaceOrderHandler = http.put(`${PATH}/order`, async ({ request }) => {
  const body = (await request.json().catch(() => null)) as ReplaceAdminAdPostingOrderRequest | null;
  if (body === null || typeof body.placement !== 'string' || !PLACEMENTS.includes(body.placement)) {
    return badRequest(PLACEMENT_MESSAGE);
  }
  const current = adPostingsIn(body.placement);
  const ids = Array.isArray(body.adPostingIds) ? body.adPostingIds : [];
  const sameSet =
    ids.length === current.length &&
    new Set(ids).size === ids.length &&
    current.every((ad) => ids.includes(ad.id));
  if (!sameSet) {
    return badRequest('adPostingIds: 그 자리의 광고 id 를 빠짐없이 한 번씩 보내 주세요.');
  }
  ids.forEach((id, index) => {
    const ad = current.find((item) => item.id === id);
    if (ad) {
      ad.displayOrder = index + 1;
    }
  });
  saveAdPostings();
  return HttpResponse.json(ok(adPostingsIn(body.placement).map(toResponse)), { status: 200 });
});

const patchHandler = http.patch(`${PATH}/:adPostingId`, async ({ params, request }) => {
  const ad = adPostingStore.adPostings.find((item) => item.id === readId(params.adPostingId));
  if (!ad) {
    return HttpResponse.json(notFound('광고 공고를 찾을 수 없습니다.'), { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as UpdateAdminAdPostingRequest | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
    return badRequest('enabled: 참·거짓 값을 보내 주세요.');
  }
  if (body.advertiserId !== undefined && !findAdvertiser(body.advertiserId)) {
    return badRequest('advertiserId: 광고주를 골라 주세요.');
  }
  const startAt = body.startAt === undefined ? ad.startAt : body.startAt;
  const endAt = body.endAt === undefined ? ad.endAt : body.endAt;
  const error =
    (body.startAt === undefined ? null : periodValueError('startAt', body.startAt)) ??
    (body.endAt === undefined ? null : periodValueError('endAt', body.endAt)) ??
    periodError(startAt, endAt);
  if (error) {
    return badRequest(error);
  }
  Object.assign(ad, {
    startAt,
    endAt,
    enabled: body.enabled ?? ad.enabled,
    advertiserId: body.advertiserId ?? ad.advertiserId,
    updatedAt: nowKst(),
  });
  saveAdPostings();
  return HttpResponse.json(ok(toResponse(ad)), { status: 200 });
});

const deleteHandler = http.delete(`${PATH}/:adPostingId`, ({ params }) => {
  const id = readId(params.adPostingId);
  const ad = adPostingStore.adPostings.find((item) => item.id === id);
  if (!ad) {
    return HttpResponse.json(notFound('광고 공고를 찾을 수 없습니다.'), { status: 404 });
  }
  adPostingStore.adPostings = adPostingStore.adPostings.filter((item) => item.id !== id);
  renumber(ad.placement);
  saveAdPostings();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

export const adPostingAdminHandlers: HttpHandler[] = [
  listHandler,
  createHandler,
  replaceOrderHandler,
  patchHandler,
  deleteHandler,
];
