import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminAdvertisementExposureResponse,
  UpdateAdminAdvertisementExposureRequest,
} from '../../generated/admin/models';
import {
  advertisementStore,
  saveAdvertisementStore,
  type ExposureRecord,
  type ProductRecord,
} from '../fixtures/advertisement-exposures';
import { findContent } from './advertisementReports';
import { ok, paginate, readPaging } from './paging';

/**
 * 광고 공고(카드) 노출 목(PRD `prd-business-report.md` 6.8, API 계약 2절). BE(Push 5) 배포 전이라 이 모양이 계약이다.
 *
 * - 광고 공고 자리는 여섯이다(계약 8절, 공고 상세 옆·부트캠프 목록 상단 고정은 사용자 결정으로 남김): `JOB_PICK`·`JOB_LIST`·
 *   `JOB_DETAIL_SIDE`·`CALENDAR_DAY`·`MYPAGE_SCRAP`·`BOOTCAMP_LIST`. 자리마다 광고 공고 상품 하나씩을 시드로 넣는다
 * - 어드민 노출 응답에 `targetTitle`·`targetCompanyName`·`targetPublished` 가 더해진다. 노출 목록을 여기서 먼저 받아 얹는다
 * - 리스트 상단 고정(`JOB_LIST`) 노출은 직무(`jobField`)가 없으면 `전체` 탭이다(계약 10절). 같은 탭 안 같은 대상은 409, 다른 자리는
 *   같은 자리(상품) 안 같은 대상이 409. 없는 대상은 404. 나머지 검증·저장은 `./advertisements.ts` 가 그대로 한다
 *
 * `./handlers.ts` 에서 `advertisementAdminHandlers` 보다 앞에 둔다.
 */

const EXPOSURES = '*/api/v1/admin/advertisement-exposures';

/** 계약 8절. 판매 상품이 없는 `BOOTCAMP_LIST` 는 뺐다. 공고 상세 옆(`JOB_DETAIL_SIDE`)은 남긴다(2026-11-19 사용자). 대상은 모두 채용공고다. */
export type AdPostingPosition =
  | 'JOB_PICK'
  | 'JOB_LIST'
  | 'JOB_DETAIL_SIDE'
  | 'CALENDAR_DAY'
  | 'MYPAGE_SCRAP'
  | 'BOOTCAMP_LIST';

/** 어드민 노출 응답에 이 목이 얹는 칸. 배너는 모두 null 이다. */
export type AdminAdPostingExposureResponse = AdminAdvertisementExposureResponse & {
  /** 리스트 상단 고정(`JOB_LIST`) 노출의 직무. 다른 자리·배너는 null 이다(계약 8절). */
  jobField: string | null;
  /** 오공고 PICK 노출의 추천 문구(계약 9절). 다른 자리·배너는 null 이다. */
  recommendationTitle: string | null;
  recommendationDescription: string | null;
  targetTitle: string | null;
  targetCompanyName: string | null;
  targetPublished: boolean | null;
};

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ status, code, message }, { status });
}

const SEED_TIME = '2026-11-06T09:00:00';

const POSTING_PRODUCTS: { id: number; position: AdPostingPosition; name: string; price: number }[] =
  [
    { id: 101, position: 'JOB_LIST', name: '리스트 상단 고정 공고', price: 300000 },
    { id: 102, position: 'CALENDAR_DAY', name: '공고 달력 날짜별 공고', price: 200000 },
    { id: 103, position: 'JOB_DETAIL_SIDE', name: '공고 상세 옆 추천 공고', price: 150000 },
    { id: 110, position: 'MYPAGE_SCRAP', name: '마이페이지 스크랩 칸 공고', price: 150000 },
    { id: 112, position: 'BOOTCAMP_LIST', name: '부트캠프 목록 상단 고정', price: 200000 },
    { id: 111, position: 'JOB_PICK', name: '인기 채용공고 추천 카드', price: 400000 },
  ];

/** 시드 상품의 자리가 이 값으로 바뀌어 있으면 이 목의 옛 판이 남긴 것이라 시드 자리로 되돌린다. */
const STALE_POSITIONS: readonly string[] = [
  'BOOTCAMP_LIST',
  'JOB_DETAIL_SIDE',
  'CALENDAR_DAY',
  'MYPAGE_SCRAP',
];

/**
 * 이 목의 옛 판이 어드민 브라우저 `localStorage` 에 남긴 시드 상품 자리(102 부트캠프 목록, 잠깐 마이페이지 스크랩이던 103)를
 * 지금 시드 자리로 되돌린다. 부트캠프 목록 상단 고정이 아닌 상품에 남은 옛 부트캠프 노출은 지운다(채용공고만 걸린다).
 */
function migrateRemovedPositions() {
  for (const product of POSTING_PRODUCTS) {
    const stored = advertisementStore.products.find((item) => item.id === product.id);
    const position = String(stored?.position ?? '');
    if (stored && position !== product.position && STALE_POSITIONS.includes(position)) {
      Object.assign(stored, {
        name: product.name,
        price: product.price,
        position: product.position as unknown as ProductRecord['position'],
      });
    }
  }
  advertisementStore.exposures = advertisementStore.exposures.filter(
    (exposure) =>
      !(
        exposure.targetType === 'BOOTCAMP' &&
        POSTING_PRODUCTS.some(
          (product) => product.id === exposure.productId && product.position !== 'BOOTCAMP_LIST',
        )
      ),
  );
}

/**
 * 시드. 저장소를 `./advertisements.ts` 와 같이 쓰고 `localStorage` 에 남으므로 없을 때만 넣는다. 리스트 상단 고정 자리에는
 * 새싹컴퍼니 계약(1번)에 걸린 광고 하나와 자체 홍보 하나, 공고 달력 자리에는 하나를 건다. 계약 1번에는 이 자리 상품을
 * 붙여 광고 카드 상품의 리포트도 볼 수 있게 한다.
 */
function seedPostings() {
  for (const product of POSTING_PRODUCTS) {
    if (advertisementStore.products.some((item) => item.id === product.id)) continue;
    advertisementStore.products.push({
      ...product,
      // 생성 타입의 자리 enum 에는 아직 새 자리가 없다(코드젠 전).
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
        targetType: 'JOB',
        targetId: 1,
        jobField: 'MARKETING_ADVERTISING',
        startAt: '2026-11-12T00:00:00',
        endAt: '2026-11-30T23:59:59',
        displayOrder: 1,
      },
      {
        ...base,
        id: nextId + 1,
        productId: 101,
        contractId: null,
        targetType: 'JOB',
        targetId: 2,
        jobField: 'IT_DEVELOPMENT',
        adLabel: false,
        startAt: null,
        endAt: null,
        displayOrder: 2,
      },
    );
  }
  // 오공고 PICK 자리. 운영자 PICK 처럼 추천 문구 두 칸이 있다(계약 9절).
  if (!advertisementStore.exposures.some((exposure) => exposure.productId === 111)) {
    advertisementStore.exposures.push({
      id: Math.max(0, ...advertisementStore.exposures.map((item) => item.id)) + 1,
      productId: 111,
      contractId: null,
      name: null,
      imageUrl: null,
      linkUrl: null,
      targetType: 'JOB',
      targetId: 7,
      recommendationTitle: '바이오 QC 첫 커리어로 추천',
      recommendationDescription: '신입도 지원할 수 있는 품질관리 계약직이에요.',
      adLabel: true,
      exposed: true,
      advertiserCompanyName: null,
      startAt: null,
      endAt: null,
      displayOrder: 1,
      registeredAt: SEED_TIME,
      updatedAt: SEED_TIME,
    });
  }
  // 부트캠프 목록 상단 고정 자리. 대상은 부트캠프다.
  if (!advertisementStore.exposures.some((exposure) => exposure.productId === 112)) {
    advertisementStore.exposures.push({
      id: Math.max(0, ...advertisementStore.exposures.map((item) => item.id)) + 1,
      productId: 112,
      contractId: null,
      name: null,
      imageUrl: null,
      linkUrl: null,
      targetType: 'BOOTCAMP',
      targetId: 3,
      adLabel: true,
      exposed: true,
      advertiserCompanyName: null,
      startAt: null,
      endAt: null,
      displayOrder: 1,
      registeredAt: SEED_TIME,
      updatedAt: SEED_TIME,
    });
  }
  // 공고 달력 자리. 옛 부트캠프 노출을 지운 저장소에도 다시 하나 건다.
  if (!advertisementStore.exposures.some((exposure) => exposure.productId === 102)) {
    advertisementStore.exposures.push({
      id: Math.max(0, ...advertisementStore.exposures.map((item) => item.id)) + 1,
      productId: 102,
      contractId: null,
      name: null,
      imageUrl: null,
      linkUrl: null,
      targetType: 'JOB',
      targetId: 4,
      adLabel: true,
      exposed: true,
      advertiserCompanyName: null,
      startAt: null,
      endAt: null,
      displayOrder: 1,
      registeredAt: SEED_TIME,
      updatedAt: SEED_TIME,
    });
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
      name: null,
      imageUrl: null,
      linkUrl: null,
      targetType: 'JOB',
      targetId: 3,
      jobField: 'IT_DEVELOPMENT',
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
      productName: '리스트 상단 고정 공고',
      category: 'JOB_POSTING',
      productDeleted: false,
      startDate: '2026-11-12',
      endDate: '2026-11-30',
      addedAt: SEED_TIME,
    });
  }
  saveAdvertisementStore();
}

migrateRemovedPositions();
seedPostings();

function withTarget(exposure: ExposureRecord): AdminAdPostingExposureResponse {
  const contract = advertisementStore.contracts.find((item) => item.id === exposure.contractId);
  const content =
    exposure.targetType && exposure.targetId != null
      ? findContent(exposure.targetType, exposure.targetId)
      : undefined;
  return {
    ...exposure,
    jobField: exposure.jobField ?? null,
    recommendationTitle: exposure.recommendationTitle ?? null,
    recommendationDescription: exposure.recommendationDescription ?? null,
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
    jobField?: string | null;
    recommendationTitle?: string | null;
    recommendationDescription?: string | null;
  },
  selfId?: number,
) {
  const product = advertisementStore.products.find((item) => item.id === productId);
  if (product?.category !== 'JOB_POSTING' || !body.targetType || body.targetId == null) {
    return undefined;
  }
  // 추천 문구는 오공고 PICK 만, 둘 다 공백 아닌 값으로(계약 9절). 길이는 운영자 PICK 과 같다(제목 30, 설명 200).
  const title = body.recommendationTitle?.trim() ?? '';
  const description = body.recommendationDescription?.trim() ?? '';
  if (String(product.position ?? '') === 'JOB_PICK') {
    if (!title || !description || title.length > 30 || description.length > 200) {
      return error(
        400,
        'BAD_REQUEST',
        'recommendationTitle·recommendationDescription: 오공고 PICK 은 추천 제목(30자 이하)과 설명(200자 이하)을 보내 주세요.',
      );
    }
  } else if (body.recommendationTitle != null || body.recommendationDescription != null) {
    return error(400, 'BAD_REQUEST', '추천 문구는 오공고 PICK 노출에만 보낼 수 있습니다.');
  }
  // 리스트 상단 고정은 탭(직무, 없으면 `전체`)마다 따로 본다. 직무가 없는 것끼리는 같은 탭이다.
  const byJobField = String(product.position ?? '') === 'JOB_LIST';
  if (!findContent(body.targetType, body.targetId)) {
    return error(404, 'ADVERTISEMENT_EXPOSURE_TARGET_NOT_FOUND', '광고할 공고를 찾을 수 없습니다.');
  }
  const duplicated = advertisementStore.exposures.some(
    (exposure) =>
      exposure.id !== selfId &&
      exposure.productId === productId &&
      exposure.targetType === body.targetType &&
      exposure.targetId === body.targetId &&
      (!byJobField || (exposure.jobField ?? null) === (body.jobField ?? null)),
  );
  return duplicated
    ? error(
        409,
        'ADVERTISEMENT_EXPOSURE_TARGET_DUPLICATED',
        byJobField
          ? '이 탭에 이미 같은 공고의 광고가 있습니다.'
          : '이 자리에 이미 같은 공고의 광고가 있습니다.',
      )
    : undefined;
}

const createGuardHandler = http.post(EXPOSURES, async ({ request }) => {
  const body = (await request
    .clone()
    .json()
    .catch(() => null)) as
    | (UpdateAdminAdvertisementExposureRequest & { productId?: number })
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
    .catch(() => null)) as UpdateAdminAdvertisementExposureRequest | null;
  if (!exposure || !body) return undefined;
  return targetError(exposure.productId, body, exposure.id);
});

export const advertisementPostingHandlers: HttpHandler[] = [
  listExposuresHandler,
  createGuardHandler,
  replaceGuardHandler,
];
