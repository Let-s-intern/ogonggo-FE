import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  AD_APPLICATION_FIXTURES,
  AD_BOOKABLE_WEEKS,
  AD_COUPON_FIXTURES,
  AD_PLACEMENT_FIXTURES,
  AD_REPORT_FIXTURES,
  buildAdAvailability,
  mondayAfter,
} from './fixtures/advertisement';
import type {
  AdApplication,
  AdApplicationItem,
  AdApplicationListResponse,
  AdApplicationSummary,
  AdApplicationTab,
  AdExposure,
  AdJobField,
  AdPlacementKey,
  CreateAdApplicationRequest,
  CreateAdApplicationResponse,
  RequestAdCreativeRevisionRequest,
} from './fixtures/advertisement-types';
import { BOOTCAMP_FIXTURES } from './fixtures/bootcamp';
import { JOB_FIXTURES } from './fixtures/job';
import { mockBannerAt } from './fixtures/ogonggo-banners';
import type { ErrorResponse } from '../generated/user/models/errorResponse';

/**
 * 광고 시스템 사용자 쪽 목 핸들러. 백엔드에 대응하는 API 가 아직 없고, 경로는 가칭이다
 * (`.claude/tasks/memos/백엔드-요청-광고-시스템.md`).
 *
 * - 비로그인 공개: 잔여 구좌 조회, 구좌별 노출용 광고 조회
 * - 기업회원(`users/me`): 광고 신청 생성·목록·상세·리포트, 소재 `이대로 게재`·`수정 요청`
 *
 * 신청은 메모리에 두고 생성·소재 확인이 그 상태를 바꾼다. 브라우저에서는 `localStorage` 에도 남아 새로 고쳐도 이어진다(아래 `persist`).
 * 토큰은 검사하지 않는다(다른 `users/me` 목과 같다). 잔여는 픽스처 값 그대로라 신청해도 줄지 않는다.
 */

const DAY = 24 * 60 * 60 * 1000;

const success = <T>(data: T, status = 200) =>
  HttpResponse.json({ status, message: '요청이 성공했습니다.', data }, { status });

const errorResponse = (status: number, code: string, message: string) =>
  HttpResponse.json<ErrorResponse>({ status, code, message }, { status });

const notFound = () => errorResponse(404, 'NOT_FOUND', '광고 신청을 찾을 수 없습니다.');

const badRequest = (message: string) => errorResponse(400, 'BAD_REQUEST', message);

const pad = (value: number) => String(value).padStart(2, '0');

const ymd = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function now(): string {
  const date = new Date();
  return `${ymd(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const placementOf = (key: string) =>
  AD_PLACEMENT_FIXTURES.find((placement) => placement.key === key);

/**
 * 브라우저에서는 신청·쿠폰 상태를 `localStorage` 에 남긴다. 브라우저 워커의 핸들러는 페이지 안에서 돌아 새로 고치면
 * 메모리가 처음으로 돌아가는데, 비즈니스 앱의 소재 `이대로 게재` 는 새로 고친 뒤에도 남아 있어야 확인할 수 있다
 * (`todo/tasks-ad-system-push7.md` 7.2.1). 서버(`msw/node`)에는 저장소가 없어 메모리만 쓴다.
 *
 * 픽스처를 바꿨는데 화면에 옛 값이 보이면 이 키를 지운다.
 */
const STORAGE_KEY = 'ogonggo.mock.advertisements';

interface StoredAdvertisements {
  applications: AdApplication[];
  coupons: typeof AD_COUPON_FIXTURES;
  nextApplicationId: number;
}

const storage = typeof localStorage === 'undefined' ? undefined : localStorage;

function loadStored(): StoredAdvertisements | undefined {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAdvertisements) : undefined;
  } catch {
    return undefined;
  }
}

const stored = loadStored();

const applications = new Map<number, AdApplication>(
  (stored?.applications ?? structuredClone(AD_APPLICATION_FIXTURES)).map((application) => [
    application.id,
    application,
  ]),
);

const coupons = stored?.coupons ?? structuredClone(AD_COUPON_FIXTURES);

function persist(): void {
  storage?.setItem(
    STORAGE_KEY,
    JSON.stringify({
      applications: [...applications.values()],
      coupons,
      nextApplicationId,
    } satisfies StoredAdvertisements),
  );
}

/** 잔여 구좌. `?placementKey=` 로 하나만 볼 수 있다. 판매하지 않는(`visible: false`) 구좌는 빠진다. */
const getAvailabilityHandler = http.get('*/api/v1/advertisements/availability', ({ request }) => {
  const key = new URL(request.url).searchParams.get('placementKey');
  const placements = AD_PLACEMENT_FIXTURES.filter(
    (placement) => placement.visible && (!key || placement.key === key),
  );
  if (key && placements.length === 0) {
    return badRequest('알 수 없는 구좌입니다.');
  }
  return success(buildAdAvailability(placements));
});

/** 시안 추천 카드의 해석 한 줄(`RECO[].recHead`). 해석 한 줄을 쓰는 자리에 돌려 쓴다. */
const HEADLINES = [
  '첫 인턴을 찾는 분께 추천',
  '공기업 첫 직장을 원한다면',
  '금융권 정규직을 노린다면',
];

const HEADLINE_PLACEMENTS: AdPlacementKey[] = [
  'RECOMMEND_TOP_RECRUIT',
  'SIMILAR_TOP_RECRUIT',
  'SIMILAR_TOP_EDU',
];

/**
 * 구좌별 노출용 광고. 슬롯 수만큼 채우고, 공고는 공고·부트캠프 목에서 구좌마다 다른 자리부터 가져와 눌러서 간 상세가
 * 같은 공고다. 직무별 구좌에 `?jobField=` 를 주면 그 직무의 광고로 내준다. 공고 목에 직무가 비어 있어 공고는 직무와
 * 상관없이 고르고 `jobField` 만 요청 값으로 채운다.
 * 판매하지 않는 구좌는 빈 목록이다.
 */
const getExposuresHandler = http.get('*/api/v1/advertisements/exposures', ({ request }) => {
  const params = new URL(request.url).searchParams;
  const placement = placementOf(params.get('placementKey') ?? '');
  if (!placement) {
    return badRequest('placementKey 를 알 수 없습니다.');
  }
  if (!placement.visible) {
    return success<AdExposure[]>([]);
  }
  const jobField = placement.perJobField
    ? ((params.get('jobField') ?? undefined) as AdJobField | undefined)
    : undefined;
  const offset = AD_PLACEMENT_FIXTURES.indexOf(placement) * 3;
  const headline = HEADLINE_PLACEMENTS.includes(placement.key);
  const banner = placement.format === 'BANNER';

  const posts =
    placement.target === 'BOOTCAMP'
      ? BOOTCAMP_FIXTURES.map((bootcamp) => ({ ...bootcamp, jobField: undefined }))
      : JOB_FIXTURES;
  const picked = [...posts.slice(offset), ...posts.slice(0, offset)].slice(0, placement.slotCount);

  const exposures: AdExposure[] = picked.map((post, index) => ({
    itemId: 9000 + offset * 10 + index,
    placementKey: placement.key,
    displayOrder: index + 1,
    target: placement.target,
    postId: post.id,
    postTitle: post.title,
    companyName: post.companyName,
    companyLogoUrl: post.logoUrl,
    jobField: placement.perJobField ? (jobField ?? post.jobField) : undefined,
    headline: headline ? HEADLINES[index % HEADLINES.length] : undefined,
    skillTags: headline ? ['문제 정의', '데이터 분석'] : [],
    bannerImageUrlPc: banner ? mockBannerAt(offset + index).pc : undefined,
    bannerImageUrlMo: banner ? mockBannerAt(offset + index).mo : undefined,
  }));
  return success(exposures);
});

/** 같은 주에 함께 신청할 수 없는 구좌. 시안 A1·A2·A6. */
const EXCLUSIVE_PLACEMENTS: AdPlacementKey[] = [
  'RECOMMEND_TOP_RECRUIT',
  'LIST_TOP_RECRUIT',
  'CALENDAR_TOP',
];

/** 요청 항목의 첫 잘못을 문구로. 모두 맞으면 `null`. */
function findInvalidItem(item: CreateAdApplicationRequest['items'][number]): string | null {
  const placement = placementOf(item.placementKey);
  if (!placement || !placement.visible) {
    return `${item.placementKey}: 신청할 수 없는 구좌입니다.`;
  }
  if (placement.perJobField !== Boolean(item.jobField)) {
    return placement.perJobField
      ? `${placement.name}: 직무를 골라 주세요.`
      : `${placement.name}: 직무를 고르지 않는 구좌입니다.`;
  }
  if (!Number.isInteger(item.weeks) || item.weeks < 1 || item.weeks > 4) {
    return `${placement.name}: 연속 집행은 1~4주입니다.`;
  }
  const first = ymd(mondayAfter(1));
  const last = ymd(mondayAfter(AD_BOOKABLE_WEEKS));
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(item.startDate) ||
    item.startDate < first ||
    item.startDate >= last
  ) {
    return `${placement.name}: 시작일은 ${first} 부터 12주 안이어야 합니다.`;
  }
  if (placement.unit === 'WEEK' && new Date(`${item.startDate}T00:00:00`).getDay() !== 1) {
    return `${placement.name}: 시작일은 월요일이어야 합니다.`;
  }
  return null;
}

/** 잔여가 없는 첫 항목의 구좌 이름. 모두 남아 있으면 `null`. */
function findSoldOut(items: CreateAdApplicationRequest['items']): string | null {
  const availability = buildAdAvailability(AD_PLACEMENT_FIXTURES);
  for (const item of items) {
    const entry = availability.find((each) => each.placement.key === item.placementKey);
    const period = entry?.periods.find(
      (each) =>
        each.startDate <= item.startDate &&
        item.startDate <= each.endDate &&
        (!item.jobField || each.jobField === item.jobField),
    );
    if (period && period.remaining === 0) {
      return entry!.placement.name;
    }
  }
  return null;
}

let nextApplicationId =
  stored?.nextApplicationId ?? Math.max(...AD_APPLICATION_FIXTURES.map((each) => each.id)) + 1;

/**
 * 광고 신청 생성. 시안 규칙을 본다 — 항목 1개 이상, 구좌·직무·주 수·시작일, A1·A2·A6 같은 주 중복 금지, 해석 한 줄
 * 40자와 태그 5개, 두 동의. 잔여가 0 인 기간이 있으면 409 다. 3개 이상이면 10% 할인, 쿠폰은 쿠폰 대상 첫 항목에 1주분.
 * 쿠폰만 쓰는 0원 신청이 아니면 계약·세금계산서 정보가 있어야 한다.
 *
 * 공고 제목은 목에서 찾을 곳이 없어(`./myCompanyPosts.ts` 의 저장소는 그 파일 안에 있다) `공고 {id}` 로 둔다.
 */
const createApplicationHandler = http.post(
  '*/api/v1/users/me/advertisements',
  async ({ request }) => {
    const body = (await request.json().catch(() => null)) as CreateAdApplicationRequest | null;
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return badRequest('광고할 지면을 하나 이상 추가해 주세요.');
    }
    for (const item of body.items) {
      const invalid = findInvalidItem(item);
      if (invalid) {
        return badRequest(invalid);
      }
    }
    const exclusive = body.items.filter((item) => EXCLUSIVE_PLACEMENTS.includes(item.placementKey));
    const overlapping = exclusive.some((item, index) =>
      exclusive.some(
        (other, otherIndex) => otherIndex !== index && other.startDate === item.startDate,
      ),
    );
    if (overlapping) {
      return badRequest(
        '오공고 추천 카드, 리스트 상단 고정, 달력 상단 노출은 같은 주에 함께 신청할 수 없습니다.',
      );
    }
    const { creative } = body;
    if ((creative?.headline?.length ?? 0) > 40) {
      return badRequest('해석 한 줄은 40자 이하로 입력해 주세요.');
    }
    if ((creative?.skillTags?.length ?? 0) > 5 || (creative?.taskTags?.length ?? 0) > 5) {
      return badRequest('역량 키워드와 수행 Task 는 5개까지입니다.');
    }
    if (!body.privacyAgreed || !body.policyAgreed) {
      return badRequest('개인정보 수집·이용과 광고 운영 정책에 동의해 주세요.');
    }
    const soldOut = findSoldOut(body.items);
    if (soldOut) {
      return errorResponse(409, 'AD_PLACEMENT_SOLD_OUT', `${soldOut}: 남은 구좌가 없습니다.`);
    }

    const coupon = body.couponId ? coupons.find((each) => each.id === body.couponId) : undefined;
    if (body.couponId && (!coupon || coupon.usedAt)) {
      return errorResponse(409, 'AD_COUPON_UNAVAILABLE', '쓸 수 없는 쿠폰입니다.');
    }
    const couponIndex = coupon
      ? body.items.findIndex((item) => coupon.placementKeys.includes(item.placementKey))
      : -1;
    if (coupon && couponIndex < 0) {
      return badRequest('쿠폰을 쓸 수 있는 지면이 없습니다.');
    }

    const id = nextApplicationId;
    nextApplicationId += 1;
    const receivedAt = now();
    const items: AdApplicationItem[] = body.items.map((item, index) => {
      const placement = placementOf(item.placementKey)!;
      const start = new Date(`${item.startDate}T00:00:00`);
      const end = new Date(start.getTime() + (item.weeks * 7 - 1) * DAY);
      return {
        id: id * 100 + index + 1,
        placementKey: placement.key,
        placementName: placement.name,
        jobField: item.jobField,
        startDate: item.startDate,
        endDate: ymd(end),
        weeks: item.weeks,
        amount: placement.price * item.weeks,
        couponApplied: index === couponIndex,
        creative: {
          id: (id * 100 + index + 1) * 10 + 1,
          source: creative?.source ?? 'OGONGGO_MADE',
          headline: HEADLINE_PLACEMENTS.includes(placement.key) ? creative?.headline : undefined,
          bannerImageUrlPc: placement.format === 'BANNER' ? creative?.bannerImageUrlPc : undefined,
          bannerImageUrlMo: placement.format === 'BANNER' ? creative?.bannerImageUrlMo : undefined,
          skillTags: creative?.skillTags ?? [],
          taskTags: creative?.taskTags ?? [],
          confirmStatus: 'PENDING',
        },
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const discount = items.length >= 3 ? Math.round(subtotal * 0.1) : 0;
    const couponItem = items[couponIndex];
    const couponAmount = couponItem
      ? placementOf(couponItem.placementKey)!.price * Math.min(coupon!.weeks, couponItem.weeks)
      : 0;
    const total = Math.max(0, subtotal - discount - couponAmount);
    if (total > 0 && !body.billing) {
      return badRequest('계약서와 세금계산서를 받을 정보를 입력해 주세요.');
    }
    if (coupon) {
      coupon.usedAt = receivedAt;
    }

    const date = receivedAt.slice(2, 10).replaceAll('-', '');
    const applicationNo = `AD-${date}-${String(id).padStart(4, '0')}`;
    applications.set(id, {
      id,
      applicationNo,
      status: 'RECEIVED',
      postTarget: body.postTarget,
      postId: body.postId,
      postTitle: `공고 ${body.postId}`,
      companyName: body.contact.companyName,
      purpose: body.purpose,
      items,
      amount: { subtotal, discount, coupon: couponAmount, total },
      paid: false,
      receivedAt,
      contact: body.contact,
      billing: total > 0 ? body.billing : undefined,
      waitlist: body.waitlist,
      memo: body.memo,
      history: [{ at: receivedAt, message: `신청 접수 (${applicationNo})` }],
    });
    persist();
    return success<CreateAdApplicationResponse>({ id, applicationNo }, 201);
  },
);

const isEnded = (application: AdApplication) => application.status === 'ENDED';

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

/** 내 광고 목록. `?tab=ALL|ACTIVE|ENDED`(기본 `ALL`), 최신 신청순, `?page=`·`?size=`(기본 1·10). */
const listApplicationsHandler = http.get('*/api/v1/users/me/advertisements', ({ request }) => {
  const params = new URL(request.url).searchParams;
  const tab = (params.get('tab') ?? 'ALL') as AdApplicationTab;
  if (!['ALL', 'ACTIVE', 'ENDED'].includes(tab)) {
    return badRequest('tab 은 ALL, ACTIVE, ENDED 중 하나입니다.');
  }
  const all = [...applications.values()].sort((a, b) => b.id - a.id);
  const filtered = all.filter(
    (application) => tab === 'ALL' || (tab === 'ENDED') === isEnded(application),
  );
  const pageNum = Math.max(Number(params.get('page') ?? 1) || 1, 1);
  const size = Math.max(Number(params.get('size') ?? 10) || 10, 1);
  const body: AdApplicationListResponse = {
    items: filtered.slice((pageNum - 1) * size, pageNum * size).map(toSummary),
    pageInfo: {
      pageNum,
      pageSize: size,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    },
    counts: {
      ALL: all.length,
      ACTIVE: all.filter((application) => !isEnded(application)).length,
      ENDED: all.filter(isEnded).length,
    },
  };
  return success(body);
});

const findApplication = (params: Record<string, unknown>) =>
  applications.get(Number(params.advertisementId));

const getApplicationHandler = http.get(
  '*/api/v1/users/me/advertisements/:advertisementId',
  ({ params }) => {
    const application = findApplication(params);
    return application ? success(application) : notFound();
  },
);

/** 성과 리포트. 종료된 신청만 있다. 종료 전이면 409 다. */
const getReportHandler = http.get(
  '*/api/v1/users/me/advertisements/:advertisementId/report',
  ({ params }) => {
    const application = findApplication(params);
    if (!application) {
      return notFound();
    }
    if (!isEnded(application)) {
      return errorResponse(409, 'AD_NOT_ENDED', '집행이 끝난 광고만 리포트를 볼 수 있습니다.');
    }
    const report = AD_REPORT_FIXTURES.find((each) => each.applicationId === application.id);
    return report ? success(report) : errorResponse(404, 'NOT_FOUND', '리포트를 찾을 수 없습니다.');
  },
);

/** 소재를 찾는다. 신청이 검수 단계가 아니면 409, 없으면 404 응답을 준다. */
function findReviewingCreative(params: Record<string, unknown>) {
  const application = findApplication(params);
  if (!application) {
    return { error: notFound() };
  }
  const item = application.items.find((each) => each.creative.id === Number(params.creativeId));
  if (!item) {
    return { error: errorResponse(404, 'NOT_FOUND', '소재를 찾을 수 없습니다.') };
  }
  if (application.status !== 'REVIEWING') {
    return {
      error: errorResponse(409, 'AD_NOT_REVIEWING', '소재 검수 단계에서만 확인할 수 있습니다.'),
    };
  }
  return { application, item };
}

/** 소재 `이대로 게재`. 광고주 확인만 남기고, 확정은 운영자가 한다. */
const approveCreativeHandler = http.post(
  '*/api/v1/users/me/advertisements/:advertisementId/creatives/:creativeId/approve',
  ({ params }) => {
    const found = findReviewingCreative(params);
    if (found.error) {
      return found.error;
    }
    const { application, item } = found;
    item.creative.confirmStatus = 'APPROVED';
    item.creative.revisionRequest = undefined;
    application.history.push({ at: now(), message: `${item.placementName} 소재 확인 완료` });
    persist();
    return success(application);
  },
);

/** 소재 `수정 요청`. 요청 문구가 비면 400 이다. */
const requestCreativeRevisionHandler = http.post(
  '*/api/v1/users/me/advertisements/:advertisementId/creatives/:creativeId/revision-request',
  async ({ params, request }) => {
    const found = findReviewingCreative(params);
    if (found.error) {
      return found.error;
    }
    const body = (await request
      .json()
      .catch(() => null)) as RequestAdCreativeRevisionRequest | null;
    const message = body?.message?.trim() ?? '';
    if (!message) {
      return badRequest('수정할 내용을 적어 주세요.');
    }
    const { application, item } = found;
    item.creative.confirmStatus = 'REVISION_REQUESTED';
    item.creative.revisionRequest = message;
    application.history.push({ at: now(), message: `${item.placementName} 소재 수정 요청` });
    persist();
    return success(application);
  },
);

export const advertisementHandlers: HttpHandler[] = [
  getAvailabilityHandler,
  getExposuresHandler,
  createApplicationHandler,
  listApplicationsHandler,
  getApplicationHandler,
  getReportHandler,
  approveCreativeHandler,
  requestCreativeRevisionHandler,
];
