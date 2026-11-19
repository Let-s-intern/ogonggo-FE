import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminAdvertisementContractDetailResponse,
  AdminAdvertisementContractProductResponse,
} from '../../generated/admin/models';
import { ADMIN_BOOTCAMP_FIXTURES, ADMIN_JOB_FIXTURES } from '../fixtures/admin-content';
import { advertisementStore, saveAdvertisementStore } from '../fixtures/advertisement-exposures';
import { ok } from './paging';

/**
 * 광고 계약의 리포트 대상 공고 연결 목(PRD `prd-business-report.md` 6.3·6.7, API 계약
 * `.claude/tasks/memos/광고-리포트-API-계약-2026-11-19.md` 3절). BE(Push 3) 가 아직 없어 이 모양이 그대로 계약이다.
 *
 * 계약 상세(`GET /advertisement-contracts/{id}`)를 여기서 먼저 받아 `targets` 를 얹는다. `./handlers.ts` 에서
 * `advertisementAdminHandlers` 보다 앞에 둔다. 계약 저장소는 그쪽과 같이 쓰고, 연결한 대상만 따로 `localStorage` 에 둔다.
 */

const CONTRACTS = '*/api/v1/admin/advertisement-contracts';
const STORAGE_KEY = 'ogonggo.mock.admin.contractTargets';

export type ContractTargetType = 'JOB' | 'BOOTCAMP';

/** 계약 상세 응답의 `targets[]`. */
export interface AdminContractTarget {
  targetType: ContractTargetType;
  targetId: number;
  title: string;
  companyName: string;
}

export interface AddContractTargetRequest {
  targetType: ContractTargetType;
  targetId: number;
}

export type ReportUnavailableReason = 'NO_PERIOD' | 'NOT_EXPOSABLE';

/** 계약 상세 `products[]` 에 이 목이 얹는 칸. */
export type AdminContractProductWithReport = AdminAdvertisementContractProductResponse & {
  reportAvailable: boolean;
  reportUnavailableReason: ReportUnavailableReason | null;
};

/** 계약 상세 응답에 이 목이 얹는 칸. 코드젠 뒤에는 생성 타입이 갖는다. */
export type AdminContractDetailWithTargets = AdminAdvertisementContractDetailResponse & {
  targets: AdminContractTarget[];
  products: AdminContractProductWithReport[];
};

type TargetKey = AddContractTargetRequest;

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ status, code, message }, { status });
}

/** 공고·부트캠프 픽스처에서 제목·회사·공개 여부를 찾는다. 없으면 `undefined`. */
export function findContent(targetType: ContractTargetType, targetId: number) {
  const row =
    targetType === 'JOB'
      ? ADMIN_JOB_FIXTURES.find((job) => job.id === targetId)
      : ADMIN_BOOTCAMP_FIXTURES.find((bootcamp) => bootcamp.id === targetId);
  return row
    ? { title: row.title, companyName: row.companyName, published: row.visibility === 'VISIBLE' }
    : undefined;
}

/** 시드: 새싹컴퍼니 신청서 계약(1번)에 공고 하나를 미리 연결해 둔다. 나머지 신청서 계약은 비어 있다. */
function seed(): Record<number, TargetKey[]> {
  const job = ADMIN_JOB_FIXTURES[0];
  return job ? { 1: [{ targetType: 'JOB', targetId: job.id }] } : {};
}

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function load(): Record<number, TargetKey[]> {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<number, TargetKey[]>;
  } catch {
    // 깨진 값이면 시드로 시작한다.
  }
  return seed();
}

const linked: Record<number, TargetKey[]> = load();

function save() {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(linked));
  } catch {
    // 메모리에는 남는다.
  }
}

/** 공고 등록 계약은 계약의 공고가 자동으로 대상이다. 지울 수 없다. */
function fixedTarget(contract: AdminAdvertisementContractDetailResponse): TargetKey | null {
  if (contract.source !== 'COMPANY_POSTING' || contract.targetId == null) return null;
  return {
    targetType: contract.promotionTarget === 'BOOTCAMP' ? 'BOOTCAMP' : 'JOB',
    targetId: contract.targetId,
  };
}

const sameTarget = (a: TargetKey, b: TargetKey) =>
  a.targetType === b.targetType && a.targetId === b.targetId;

/** 계약의 대상 전부. 자동 대상이 맨 앞이다. */
export function contractTargets(
  contract: AdminAdvertisementContractDetailResponse,
): AdminContractTarget[] {
  const fixed = fixedTarget(contract);
  const keys = [
    ...(fixed ? [fixed] : []),
    ...(linked[contract.id] ?? []).filter((key) => !fixed || !sameTarget(key, fixed)),
  ];
  return keys.map((key) => {
    const content = findContent(key.targetType, key.targetId);
    return {
      ...key,
      title: content?.title ?? contract.recruitmentTitle,
      companyName: content?.companyName ?? contract.companyName,
    };
  });
}

function findContract(raw: unknown) {
  const id = Number(raw);
  return advertisementStore.contracts.find((contract) => contract.id === id);
}

const contractNotFound = () =>
  error(404, 'ADVERTISEMENT_CONTRACT_NOT_FOUND', '광고 계약을 찾을 수 없습니다.');

const getContractHandler = http.get(`${CONTRACTS}/:contractId`, ({ params }) => {
  const contract = findContract(params.contractId);
  if (!contract) return contractNotFound();
  const body: AdminContractDetailWithTargets = {
    ...contract,
    targets: contractTargets(contract),
    products: contract.products.map((product) => {
      const reason = unavailableReason(product);
      return { ...product, reportAvailable: reason === null, reportUnavailableReason: reason };
    }),
  };
  return HttpResponse.json(ok(body), { status: 200 });
});

/** 중복 409, 없는 대상 404. 공고 등록 계약의 자동 대상도 중복이다. */
const addTargetHandler = http.post(
  `${CONTRACTS}/:contractId/targets`,
  async ({ params, request }) => {
    const contract = findContract(params.contractId);
    if (!contract) return contractNotFound();
    const body = (await request.json().catch(() => null)) as Partial<TargetKey> | null;
    const targetType = body?.targetType;
    const targetId = Number(body?.targetId);
    if ((targetType !== 'JOB' && targetType !== 'BOOTCAMP') || !Number.isInteger(targetId)) {
      return error(400, 'BAD_REQUEST', 'targetType, targetId 를 보내 주세요.');
    }
    if (!findContent(targetType, targetId)) {
      return error(404, 'ADVERTISEMENT_CONTRACT_TARGET_NOT_FOUND', '대상 공고를 찾을 수 없습니다.');
    }
    const key = { targetType, targetId };
    if (contractTargets(contract).some((target) => sameTarget(target, key))) {
      return error(
        409,
        'ADVERTISEMENT_CONTRACT_TARGET_DUPLICATED',
        '이미 이 계약에 연결한 대상입니다.',
      );
    }
    linked[contract.id] = [...(linked[contract.id] ?? []), key];
    save();
    return HttpResponse.json({ status: 201, message: 'Created', data: null }, { status: 201 });
  },
);

const removeTargetHandler = http.delete(
  `${CONTRACTS}/:contractId/targets/:targetType/:targetId`,
  ({ params }) => {
    const contract = findContract(params.contractId);
    if (!contract) return contractNotFound();
    const key = {
      targetType: params.targetType as ContractTargetType,
      targetId: Number(params.targetId),
    };
    const fixed = fixedTarget(contract);
    if (fixed && sameTarget(fixed, key)) {
      return error(
        409,
        'ADVERTISEMENT_CONTRACT_TARGET_FIXED',
        '공고 등록 계약의 공고는 대상에서 뺄 수 없습니다.',
      );
    }
    const before = linked[contract.id] ?? [];
    if (!before.some((item) => sameTarget(item, key))) {
      return error(
        404,
        'ADVERTISEMENT_CONTRACT_TARGET_NOT_FOUND',
        '이 계약에 연결한 대상이 아닙니다.',
      );
    }
    linked[contract.id] = before.filter((item) => !sameTarget(item, key));
    save();
    return new HttpResponse(null, { status: 204 });
  },
);

/* ---------------------------------------------------------------- 상품별 리포트 (API 계약 3절) */

export type ReportSource = 'AD_CARD' | 'BANNER' | 'LIST' | 'SEARCH' | 'EXTERNAL';

export interface ReportDetailMetrics {
  views: number;
  uniqueVisitors: number;
  memberViews: number;
  ctaClicks: number;
  ctaUniqueVisitors: number;
  avgScrollPercent: number | null;
  avgDurationSeconds: number | null;
}

export interface ReportSummary extends ReportDetailMetrics {
  impressions: number;
  adClicks: number;
  adClickRate: number | null;
  memberUniqueVisitors: number;
  ctaUniqueMembers: number;
  ctaClickRate: number | null;
  /** 스크롤 깊이 깔때기. 0% 단계가 순 방문자 전체다. `rate` 는 순 방문자 대비, 분모가 0 이면 null. */
  scrollFunnel: ScrollFunnelStep[];
}

export interface ScrollFunnelStep {
  threshold: 0 | 25 | 50 | 75 | 100;
  visitors: number;
  rate: number | null;
}

/** 목의 단계별 도달 비율. 방문자별로 가장 깊이 내린 값으로 센다(BE). */
const SCROLL_STEPS = [
  [0, 1],
  [25, 0.9],
  [50, 0.7],
  [75, 0.45],
  [100, 0.2],
] as const;

export interface ReportDaily extends Omit<
  ReportDetailMetrics,
  'avgScrollPercent' | 'avgDurationSeconds'
> {
  date: string;
  impressions: number;
  adClicks: number;
  avgScrollPercent: number | null;
  avgDurationSeconds: number | null;
}

export interface ReportExposure {
  exposureId: number;
  name: string;
  impressions: number;
  adClicks: number;
  adClickRate: number | null;
}

export interface ReportTarget {
  targetType: ContractTargetType;
  targetId: number;
  title: string;
  total: ReportDetailMetrics;
  bySource: { source: ReportSource; views: number; ctaClicks: number }[];
}

export interface AdminContractProductReport {
  product: {
    contractProductId: number;
    productId: number;
    category: string;
    position: string | null;
    name: string;
    startDate: string;
    endDate: string;
  };
  from: string;
  to: string;
  collectedSince: string;
  summary: ReportSummary;
  daily: ReportDaily[];
  exposures: ReportExposure[];
  targets: ReportTarget[];
}

/** 목의 수집 시작일. 이보다 앞 날짜는 모두 0 이고 화면이 `집계 전` 으로 적는다. */
const COLLECTED_SINCE = '2026-11-08';
/** 오공고 화면에 노출하는 카테고리만 리포트가 있다. 인스타·카카오는 집계 대상이 아니다(D8). */
const REPORTABLE: readonly string[] = ['BANNER', 'JOB_POSTING'];

function unavailableReason(
  product: AdminAdvertisementContractProductResponse,
): ReportUnavailableReason | null {
  if (!REPORTABLE.includes(product.category)) return 'NOT_EXPOSABLE';
  if (!product.startDate || !product.endDate) return 'NO_PERIOD';
  return null;
}

/**
 * 리포트 화면 확인용 시드. 새싹컴퍼니 계약(1번)에 인스타그램 상품(채널, 리포트 없음)을 붙인다. 배너 상품(리포트 있음)은 원래
 * 시드에 있고, 기간 없는 상품은 공고 등록 계약(4번)에 있다. 저장소를 같이 쓰므로 이미 있으면 다시 넣지 않는다.
 */
const CHANNEL_PRODUCT_ID = 104;
const CHANNEL_CONTRACT_PRODUCT_ID = 901;

function seedReportFixtures() {
  if (!advertisementStore.products.some((product) => product.id === CHANNEL_PRODUCT_ID)) {
    advertisementStore.products.push({
      id: CHANNEL_PRODUCT_ID,
      category: 'INSTAGRAM_1',
      position: null,
      name: '인스타그램 오공고 피드',
      price: 150000,
      registeredAt: '2026-11-06T09:00:00',
      updatedAt: '2026-11-06T09:00:00',
      deletedAt: null,
    });
  }
  const contract = advertisementStore.contracts.find((item) => item.id === 1);
  if (
    contract &&
    !advertisementStore.contracts.some((item) =>
      item.products.some((cp) => cp.contractProductId === CHANNEL_CONTRACT_PRODUCT_ID),
    )
  ) {
    contract.products.push({
      contractProductId: CHANNEL_CONTRACT_PRODUCT_ID,
      productId: CHANNEL_PRODUCT_ID,
      productName: '인스타그램 오공고 피드',
      category: 'INSTAGRAM_1',
      productDeleted: false,
      startDate: '2026-11-15',
      endDate: '2026-11-21',
      addedAt: '2026-11-06T09:00:00',
    });
  }
  saveAdvertisementStore();
}

seedReportFixtures();

function todayKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`) + days * 24 * 60 * 60 * 1000;
  return new Date(time).toISOString().slice(0, 10);
}

function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) dates.push(date);
  return dates;
}

/** 같은 입력이면 같은 숫자. 새로고침해도 리포트가 바뀌지 않는다. */
function noise(...parts: (string | number)[]): number {
  let hash = 2166136261;
  for (const char of parts.join('|')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

const rate = (numerator: number, denominator: number) =>
  denominator === 0 ? null : Math.round((numerator / denominator) * 10000) / 10000;

const round1 = (value: number) => Math.round(value * 10) / 10;

interface DayExposureRow {
  date: string;
  exposureId: number;
  exposureName: string;
  impressions: number;
  adClicks: number;
  views: number;
  uniqueVisitors: number;
  memberViews: number;
  ctaClicks: number;
  ctaUniqueVisitors: number;
  avgScrollPercent: number | null;
  avgDurationSeconds: number | null;
}

/** 날짜·소재 한 칸. 수집 전 날과 일주일에 하루쯤은 0 이다(데이터 없는 날). */
function dayExposureRow(date: string, exposure: { id: number; name: string }): DayExposureRow {
  const empty = date < COLLECTED_SINCE || noise(date, exposure.id, 'empty') < 0.12;
  const impressions = empty ? 0 : Math.round(300 + noise(date, exposure.id, 'imp') * 600);
  const adClicks = Math.round(impressions * (0.008 + noise(date, exposure.id, 'ctr') * 0.022));
  const views = Math.round(adClicks * (0.7 + noise(date, exposure.id, 'view') * 0.25));
  const uniqueVisitors = Math.round(views * 0.85);
  const ctaClicks = Math.round(views * (0.1 + noise(date, exposure.id, 'cta') * 0.2));
  return {
    date,
    exposureId: exposure.id,
    exposureName: exposure.name,
    impressions,
    adClicks,
    views,
    uniqueVisitors,
    memberViews: Math.round(views * 0.5),
    ctaClicks,
    ctaUniqueVisitors: Math.round(ctaClicks * 0.85),
    avgScrollPercent: views === 0 ? null : round1(45 + noise(date, exposure.id, 'scroll') * 35),
    avgDurationSeconds: views === 0 ? null : round1(20 + noise(date, exposure.id, 'dur') * 50),
  };
}

/** 조회 수로 가중한 평균. 조회가 없으면 null. */
function weightedAverage(rows: DayExposureRow[], key: 'avgScrollPercent' | 'avgDurationSeconds') {
  const views = rows.reduce((sum, row) => sum + row.views, 0);
  if (views === 0) return null;
  return round1(rows.reduce((sum, row) => sum + (row[key] ?? 0) * row.views, 0) / views);
}

function sumDetail(rows: DayExposureRow[]) {
  const total = (
    key: 'views' | 'uniqueVisitors' | 'memberViews' | 'ctaClicks' | 'ctaUniqueVisitors',
  ) => rows.reduce((sum, row) => sum + row[key], 0);
  return {
    views: total('views'),
    uniqueVisitors: total('uniqueVisitors'),
    memberViews: total('memberViews'),
    ctaClicks: total('ctaClicks'),
    ctaUniqueVisitors: total('ctaUniqueVisitors'),
    avgScrollPercent: weightedAverage(rows, 'avgScrollPercent'),
    avgDurationSeconds: weightedAverage(rows, 'avgDurationSeconds'),
  };
}

type ReportInput = { from: string; to: string; rows: DayExposureRow[] };

/** 상품 기간으로 자른 `from`·`to` 와 날짜·소재 행. 리포트를 열 수 없으면 오류 응답이다. */
function reportInput(params: Record<string, unknown>, url: URL): ReportInput | Response {
  const contract = findContract(params.contractId);
  if (!contract) return contractNotFound();
  const product = contract.products.find(
    (item) => item.contractProductId === Number(params.contractProductId),
  );
  if (!product) {
    return error(
      404,
      'ADVERTISEMENT_CONTRACT_PRODUCT_NOT_FOUND',
      '계약에 붙인 광고 상품을 찾을 수 없습니다.',
    );
  }
  if (unavailableReason(product) !== null) {
    return error(409, 'REPORT_NOT_AVAILABLE', '리포트를 열 수 없는 상품입니다.');
  }
  const startDate = product.startDate as string;
  const endDate = product.endDate as string;
  const today = todayKst();
  const requestedFrom = url.searchParams.get('from') || startDate;
  const requestedTo = url.searchParams.get('to') || (endDate < today ? endDate : today);
  const from = requestedFrom < startDate ? startDate : requestedFrom;
  let to = requestedTo > endDate ? endDate : requestedTo;
  if (to < from) to = from;
  // 상품 소재: 이 계약·상품의 노출 중 기간이 상품 기간과 겹치는 것(PRD 6.3).
  const exposures = advertisementStore.exposures.filter(
    (exposure) =>
      exposure.contractId === contract.id &&
      exposure.productId === product.productId &&
      (!exposure.startAt || exposure.startAt.slice(0, 10) <= endDate) &&
      (!exposure.endAt || exposure.endAt.slice(0, 10) >= startDate),
  );
  const rows = datesBetween(from, to).flatMap((date) =>
    exposures.map((exposure) =>
      dayExposureRow(date, { id: exposure.id, name: exposureName(exposure) }),
    ),
  );
  return { from, to, rows };
}

/** 배너는 노출 이름, 광고 카드는 이름이 없어 띄운 공고 제목을 쓴다. */
function exposureName(exposure: {
  id: number;
  name?: string | null;
  targetType?: string | null;
  targetId?: number | null;
}) {
  if (exposure.name) return exposure.name;
  const content =
    (exposure.targetType === 'JOB' || exposure.targetType === 'BOOTCAMP') &&
    exposure.targetId != null
      ? findContent(exposure.targetType, exposure.targetId)
      : undefined;
  return content ? `광고 카드 · ${content.title}` : `소재 #${exposure.id}`;
}

const REPORT = `${CONTRACTS}/:contractId/products/:contractProductId`;

const reportHandler = http.get(`${REPORT}/report`, ({ params, request }) => {
  const input = reportInput(params, new URL(request.url));
  if (input instanceof Response) return input;
  const contract = findContract(params.contractId) as AdminAdvertisementContractDetailResponse;
  const cp = contract.products.find(
    (item) => item.contractProductId === Number(params.contractProductId),
  ) as AdminAdvertisementContractProductResponse;
  const product = advertisementStore.products.find((item) => item.id === cp.productId);
  const { from, to, rows } = input;

  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const adClicks = rows.reduce((sum, row) => sum + row.adClicks, 0);
  const detail = sumDetail(rows);
  // 기간 순 방문자는 날짜 합보다 작다(같은 사람이 여러 날 온다).
  const uniqueVisitors = Math.round(detail.uniqueVisitors * 0.8);
  const ctaUniqueVisitors = Math.round(detail.ctaUniqueVisitors * 0.85);
  const summary: ReportSummary = {
    impressions,
    adClicks,
    adClickRate: rate(adClicks, impressions),
    ...detail,
    uniqueVisitors,
    memberUniqueVisitors: Math.round(uniqueVisitors * 0.55),
    ctaUniqueVisitors,
    ctaUniqueMembers: Math.round(ctaUniqueVisitors * 0.6),
    ctaClickRate: rate(ctaUniqueVisitors, uniqueVisitors),
    scrollFunnel: SCROLL_STEPS.map(([threshold, share]) => {
      const visitors = Math.round(uniqueVisitors * share);
      return { threshold, visitors, rate: rate(visitors, uniqueVisitors) };
    }),
  };

  const daily: ReportDaily[] = datesBetween(from, to).map((date) => {
    const day = rows.filter((row) => row.date === date);
    return {
      date,
      impressions: day.reduce((sum, row) => sum + row.impressions, 0),
      adClicks: day.reduce((sum, row) => sum + row.adClicks, 0),
      ...sumDetail(day),
    };
  });

  const exposureIds = [...new Set(rows.map((row) => row.exposureId))];
  const exposures: ReportExposure[] = exposureIds.map((exposureId) => {
    const own = rows.filter((row) => row.exposureId === exposureId);
    const ownImpressions = own.reduce((sum, row) => sum + row.impressions, 0);
    const ownClicks = own.reduce((sum, row) => sum + row.adClicks, 0);
    return {
      exposureId,
      name: own[0]?.exposureName ?? '',
      impressions: ownImpressions,
      adClicks: ownClicks,
      adClickRate: rate(ownClicks, ownImpressions),
    };
  });

  // 대상 공고 전체 숫자: 이 상품 몫(배너·광고 카드)에 다른 경로 유입을 더한다. 상품 몫은 첫 대상에 몬다.
  const ownSource: ReportSource = cp.category === 'BANNER' ? 'BANNER' : 'AD_CARD';
  const targets: ReportTarget[] = contractTargets(contract).map((target, index) => {
    const days = datesBetween(from, to).filter((date) => date >= COLLECTED_SINCE).length;
    const base = (source: string) =>
      Math.round(days * (5 + noise(target.targetId, source, from, to) * 30));
    const bySource = (['AD_CARD', 'BANNER', 'LIST', 'SEARCH', 'EXTERNAL'] as const).map(
      (source) => {
        const views =
          source === 'AD_CARD' || source === 'BANNER'
            ? source === ownSource && index === 0
              ? detail.views
              : 0
            : base(source);
        const ctaClicks =
          source === ownSource && index === 0 ? detail.ctaClicks : Math.round(views * 0.15);
        return { source, views, ctaClicks };
      },
    );
    const views = bySource.reduce((sum, row) => sum + row.views, 0);
    const ctaClicks = bySource.reduce((sum, row) => sum + row.ctaClicks, 0);
    return {
      targetType: target.targetType,
      targetId: target.targetId,
      title: target.title,
      total: {
        views,
        uniqueVisitors: Math.round(views * 0.75),
        memberViews: Math.round(views * 0.45),
        ctaClicks,
        ctaUniqueVisitors: Math.round(ctaClicks * 0.85),
        avgScrollPercent: views === 0 ? null : round1(50 + noise(target.targetId, 'scroll') * 20),
        avgDurationSeconds: views === 0 ? null : round1(25 + noise(target.targetId, 'dur') * 30),
      },
      bySource,
    };
  });

  const body: AdminContractProductReport = {
    product: {
      contractProductId: cp.contractProductId,
      productId: cp.productId,
      category: cp.category,
      position: product?.position ?? null,
      name: cp.productName,
      startDate: cp.startDate as string,
      endDate: cp.endDate as string,
    },
    from,
    to,
    collectedSince: COLLECTED_SINCE,
    summary,
    daily,
    exposures,
    targets,
  };
  return HttpResponse.json(ok(body), { status: 200 });
});

const CSV_COLUMNS = [
  'date',
  'exposureId',
  'exposureName',
  'impressions',
  'adClicks',
  'views',
  'uniqueVisitors',
  'memberViews',
  'ctaClicks',
  'ctaUniqueVisitors',
  'avgScrollPercent',
  'avgDurationSeconds',
] as const;

const csvCell = (value: string | number | null) => {
  if (value === null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** 날짜·소재별 행. BOM 을 붙여 엑셀이 한글을 깨뜨리지 않는다. */
const reportCsvHandler = http.get(`${REPORT}/report.csv`, ({ params, request }) => {
  const input = reportInput(params, new URL(request.url));
  if (input instanceof Response) return input;
  const lines = [
    CSV_COLUMNS.join(','),
    ...input.rows.map((row) => CSV_COLUMNS.map((column) => csvCell(row[column])).join(',')),
  ];
  return new HttpResponse(`﻿${lines.join('\n')}\n`, {
    status: 200,
    headers: { 'Content-Type': 'text/csv; charset=UTF-8' },
  });
});

export const advertisementReportHandlers: HttpHandler[] = [
  getContractHandler,
  addTargetHandler,
  removeTargetHandler,
  // `report.csv` 를 `report` 보다 앞에 둔다.
  reportCsvHandler,
  reportHandler,
];
