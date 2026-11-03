import { http, HttpResponse, type HttpHandler } from 'msw';
import { ADMIN_AD_APPLICATION_FIXTURES } from '../fixtures/admin-advertisement';
import { AD_PLACEMENT_FIXTURES } from '../fixtures/advertisement';
import type {
  AdApplication,
  AdApplicationStatus,
  AdApplicationSummary,
  AdminAdPlacementSetting,
  ReorderAdminAdPlacementRequest,
  UpdateAdminAdApplicationStatusRequest,
  UpdateAdminAdPlacementRequest,
} from '../fixtures/advertisement-types';
import { matches, notFound, ok, paginate, readPaging } from './paging';

/**
 * 광고 구좌 설정과 광고 신청 핸들러. 백엔드에 대응하는 API 가 아직 없고, 경로는 가칭이다
 * (`.claude/tasks/memos/백엔드-요청-광고-시스템.md`).
 *
 * PRD `어드민 > 구좌 세팅` 결정(광고별 묶음)을 따른다. 광고 신청 하나를 확정하면 그 신청의 지면이 한 번에 각 구좌 끝에
 * 배치되고, 구좌 설정에서 구좌 안 노출 순서를 바꾼다. 구좌 설정에는 확정·집행 중 항목만 보인다.
 *
 * 쓰기가 일어나는 핸들러다. 값은 모듈 안에 있어 목을 다시 띄우면 처음으로 돌아간다.
 */

const placements = structuredClone(AD_PLACEMENT_FIXTURES);

/** 신청 상세·소재 핸들러(`./advertisement-details.ts`)가 같은 저장소를 쓴다. */
export const applications = new Map<number, AdApplication>(
  structuredClone(ADMIN_AD_APPLICATION_FIXTURES).map((application) => [
    application.id,
    application,
  ]),
);

const STATUSES: AdApplicationStatus[] = [
  'RECEIVED',
  'QUOTED',
  'CONTRACTED',
  'PAID',
  'REVIEWING',
  'CONFIRMED',
  'RUNNING',
  'ENDED',
];

/** 구좌에 배치된 것으로 보는 단계. 종료된 광고는 구좌에서 빠진다. */
const PLACED: AdApplicationStatus[] = ['CONFIRMED', 'RUNNING'];

const STATUS_LABELS: Record<AdApplicationStatus, string> = {
  RECEIVED: '접수',
  QUOTED: '견적',
  CONTRACTED: '계약',
  PAID: '입금',
  REVIEWING: '검수',
  CONFIRMED: '확정',
  RUNNING: '집행',
  ENDED: '종료',
};

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

function conflict(code: string, message: string) {
  return HttpResponse.json({ status: 409, code, message }, { status: 409 });
}

function now(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** 구좌에 배치된 항목. 노출 순서대로. */
function placedItems(placementKey: string) {
  return [...applications.values()]
    .filter((application) => PLACED.includes(application.status))
    .flatMap((application) =>
      application.items
        .filter((item) => item.placementKey === placementKey && item.displayOrder !== undefined)
        .map((item) => ({ application, item })),
    )
    .sort((a, b) => a.item.displayOrder! - b.item.displayOrder!);
}

function settingOf(placement: (typeof placements)[number]): AdminAdPlacementSetting {
  return {
    placement,
    assignments: placedItems(placement.key).map(({ application, item }) => ({
      itemId: item.id,
      applicationId: application.id,
      applicationNo: application.applicationNo,
      companyName: application.companyName,
      postTitle: application.postTitle,
      jobField: item.jobField,
      startDate: item.startDate,
      endDate: item.endDate,
      displayOrder: item.displayOrder!,
      status: application.status,
    })),
  };
}

const listPlacementsHandler = http.get('*/api/v1/admin/advertisement-placements', () =>
  HttpResponse.json(ok(placements.map(settingOf))),
);

/** 구좌 설정 수정. 이름·슬롯 수·정가·노출 여부 중 보낸 칸만 바꾼다. */
const updatePlacementHandler = http.patch(
  '*/api/v1/admin/advertisement-placements/:placementKey',
  async ({ params, request }) => {
    const placement = placements.find((each) => each.key === params.placementKey);
    if (!placement) {
      return HttpResponse.json(notFound('구좌를 찾을 수 없습니다.'), { status: 404 });
    }
    const body = (await request.json().catch(() => null)) as UpdateAdminAdPlacementRequest | null;
    if (!body || typeof body !== 'object') {
      return badRequest('요청 본문이 올바르지 않습니다.');
    }
    if (body.name !== undefined && !body.name.trim()) {
      return badRequest('name: 이름을 입력해 주세요.');
    }
    if (body.slotCount !== undefined && (!Number.isInteger(body.slotCount) || body.slotCount < 1)) {
      return badRequest('slotCount: 1 이상의 정수여야 합니다.');
    }
    if (body.price !== undefined && (!Number.isInteger(body.price) || body.price < 0)) {
      return badRequest('price: 0 이상의 정수여야 합니다.');
    }
    if (body.visible !== undefined && typeof body.visible !== 'boolean') {
      return badRequest('visible: true 또는 false 여야 합니다.');
    }
    Object.assign(placement, {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.slotCount !== undefined && { slotCount: body.slotCount }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.visible !== undefined && { visible: body.visible }),
    });
    return HttpResponse.json(ok(settingOf(placement)));
  },
);

/** 구좌 안 노출 순서 변경. 지금 배치된 항목 id 전부를 빠짐없이, 겹치지 않게 보내야 한다. */
const reorderPlacementHandler = http.put(
  '*/api/v1/admin/advertisement-placements/:placementKey/order',
  async ({ params, request }) => {
    const placement = placements.find((each) => each.key === params.placementKey);
    if (!placement) {
      return HttpResponse.json(notFound('구좌를 찾을 수 없습니다.'), { status: 404 });
    }
    const body = (await request.json().catch(() => null)) as ReorderAdminAdPlacementRequest | null;
    const itemIds = Array.isArray(body?.itemIds) ? body.itemIds : null;
    const placed = placedItems(placement.key);
    const same =
      itemIds !== null &&
      itemIds.length === placed.length &&
      new Set(itemIds).size === itemIds.length &&
      placed.every(({ item }) => itemIds.includes(item.id));
    if (!same) {
      return badRequest('itemIds: 이 구좌에 배치된 항목 id 를 모두 한 번씩 보내 주세요.');
    }
    for (const { item } of placed) {
      item.displayOrder = itemIds.indexOf(item.id) + 1;
    }
    return HttpResponse.json(ok(settingOf(placement)));
  },
);

function toSummary(application: AdApplication): AdApplicationSummary {
  return {
    id: application.id,
    applicationNo: application.applicationNo,
    status: application.status,
    rejection: application.rejection,
    postTarget: application.postTarget,
    postId: application.postId,
    postTitle: application.postTitle,
    companyName: application.companyName,
    amount: application.amount,
    paid: application.paid,
    receivedAt: application.receivedAt,
    items: application.items.map(
      ({ id, placementKey, placementName, jobField, startDate, endDate, couponApplied }) => ({
        id,
        placementKey,
        placementName,
        jobField,
        startDate,
        endDate,
        couponApplied,
      }),
    ),
  };
}

/** 광고 신청 목록. `?status=` 단계, `?keyword=` 신청번호·기업명·공고명 부분 일치. 최신 신청순. */
const listApplicationsHandler = http.get('*/api/v1/admin/advertisements', ({ request }) => {
  const url = new URL(request.url);
  const { page, size } = readPaging(url);
  const status = url.searchParams.get('status');
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  if (status && !STATUSES.includes(status as AdApplicationStatus)) {
    return badRequest('status 가 올바르지 않습니다.');
  }
  const filtered = [...applications.values()]
    .filter((application) => !status || application.status === status)
    .filter(
      (application) =>
        !keyword ||
        [application.applicationNo, application.companyName, application.postTitle].some((text) =>
          matches(text, keyword),
        ),
    )
    .sort((a, b) => b.id - a.id)
    .map(toSummary);
  return HttpResponse.json(ok(paginate(filtered, page, size)));
});

const findApplication = (params: Record<string, unknown>) =>
  applications.get(Number(params.advertisementId));

const applicationNotFound = () =>
  HttpResponse.json(notFound('광고 신청을 찾을 수 없습니다.'), { status: 404 });

/**
 * 신청 상태 변경. `rejectionReason` 이 있으면 그 단계에서 반려하고, 없으면 반려를 지운다. 확정은 배치를 함께 해야 해서
 * 이 경로가 아니라 `confirm` 으로만 한다.
 */
const updateStatusHandler = http.patch(
  '*/api/v1/admin/advertisements/:advertisementId/status',
  async ({ params, request }) => {
    const application = findApplication(params);
    if (!application) {
      return applicationNotFound();
    }
    const body = (await request
      .json()
      .catch(() => null)) as UpdateAdminAdApplicationStatusRequest | null;
    if (!body || !STATUSES.includes(body.status)) {
      return badRequest('status 가 올바르지 않습니다.');
    }
    if (body.status === 'CONFIRMED') {
      return badRequest('확정은 confirm 으로 해 주세요.');
    }
    const reason = body.rejectionReason?.trim();
    const at = now();
    application.status = body.status;
    application.rejection = reason ? { status: body.status, reason, rejectedAt: at } : undefined;
    if (STATUSES.indexOf(body.status) >= STATUSES.indexOf('PAID')) {
      application.paid = true;
    }
    application.history.push({
      at,
      message: reason
        ? `${STATUS_LABELS[body.status]} 반려 · ${reason}`
        : `${STATUS_LABELS[body.status]} 단계로 변경`,
    });
    return HttpResponse.json(ok(application));
  },
);

/**
 * 신청 확정. 검수 단계이고 반려가 없으며 모든 소재를 광고주가 확인했을 때만 된다(아니면 409). 지면마다 그 구좌의 맨 뒤
 * 순서로 배치한다.
 */
const confirmHandler = http.post(
  '*/api/v1/admin/advertisements/:advertisementId/confirm',
  ({ params }) => {
    const application = findApplication(params);
    if (!application) {
      return applicationNotFound();
    }
    if (application.status !== 'REVIEWING' || application.rejection) {
      return conflict(
        'AD_NOT_CONFIRMABLE',
        '반려 없이 검수 단계에 있는 신청만 확정할 수 있습니다.',
      );
    }
    if (application.items.some((item) => item.creative.confirmStatus !== 'APPROVED')) {
      return conflict(
        'AD_CREATIVE_NOT_APPROVED',
        '광고주가 모든 소재를 확인한 뒤 확정할 수 있습니다.',
      );
    }
    const lastOrders = new Map<string, number>();
    for (const item of application.items) {
      const order =
        (lastOrders.get(item.placementKey) ?? placedItems(item.placementKey).length) + 1;
      item.displayOrder = order;
      lastOrders.set(item.placementKey, order);
    }
    application.status = 'CONFIRMED';
    application.history.push({ at: now(), message: '운영자 승인 · 확정' });
    return HttpResponse.json(ok(application));
  },
);

export const advertisementHandlers: HttpHandler[] = [
  listPlacementsHandler,
  updatePlacementHandler,
  reorderPlacementHandler,
  listApplicationsHandler,
  updateStatusHandler,
  confirmHandler,
];
