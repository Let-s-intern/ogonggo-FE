import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminAdvertisementContractDetailResponse,
  AdminAdvertisementContractProductResponse,
} from '../../generated/admin/models';
import { ADMIN_BOOTCAMP_FIXTURES, ADMIN_JOB_FIXTURES } from '../fixtures/admin-content';
import type { StoredContract, StoredContractProduct } from '../fixtures/advertisement-contracts';
import { advertisementStore, saveAdvertisementStore } from '../fixtures/advertisement-exposures';
import { enumOptions } from '../../enums';
import { ok } from './paging';

/**
 * 광고 계약의 광고할 공고 연결 목(PRD `prd-business-report.md` 6.3·6.7, API 계약
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
function fixedTarget(contract: StoredContract): TargetKey | null {
  if (contract.source !== 'COMPANY_POSTING' || contract.targetId == null) return null;
  return {
    targetType: contract.promotionTarget === 'BOOTCAMP' ? 'BOOTCAMP' : 'JOB',
    targetId: contract.targetId,
  };
}

const sameTarget = (a: TargetKey, b: TargetKey) =>
  a.targetType === b.targetType && a.targetId === b.targetId;

/** 계약의 대상 전부. 자동 대상이 맨 앞이다. */
export function contractTargets(contract: StoredContract): AdminContractTarget[] {
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
      // 실제 BE 는 공고·부트캠프 자체의 없음 코드를 돌려준다.
      return targetType === 'JOB'
        ? error(404, 'JOB_NOT_FOUND', '채용공고를 찾을 수 없습니다.')
        : error(404, 'BOOTCAMP_NOT_FOUND', '부트캠프를 찾을 수 없습니다.');
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
    // 실제 BE 처럼 연결이 없어도 성공(200, data null)이다.
    const before = linked[contract.id] ?? [];
    linked[contract.id] = before.filter((item) => !sameTarget(item, key));
    save();
    return HttpResponse.json({ status: 200, message: 'OK', data: null });
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
  /** 같은 방문자·같은 노출은 KST 하루 한 번으로 센 노출(계약 6.1). */
  uniqueImpressions: number;
  adClicks: number;
  adClickRate: number | null;
  memberUniqueVisitors: number;
  ctaUniqueMembers: number;
  ctaClickRate: number | null;
  /** 스크롤 깊이 깔때기. 0% 단계가 순 방문자 전체다. `rate` 는 순 방문자 대비, 분모가 0 이면 null. */
  /** 배너 상품은 null 이다(배너는 상세 페이지가 아니다, 계약 5절). */
  scrollFunnel: ScrollFunnelStep[] | null;
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
  uniqueImpressions: number;
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
  total: ReportDetailMetrics & { saves: number; shares: number };
  bySource: { source: ReportSource; views: number; ctaClicks: number }[];
}

export interface ReportJobField {
  /** 희망 직무 enum(`JobField`). 직무가 없는 회원은 null. */
  jobField: string | null;
  label: string;
  memberUniqueVisitors: number;
  memberViews: number;
  ctaUniqueMembers: number;
  adClickMembers: number;
}

/** 상품 몫을 본 사람의 구성(BE LC-3656). 도달·광고를 누른 사람은 원본 보관 기간을 넘기면 null. */
export interface ReportAudience {
  reach: number | null;
  avgFrequency: number | null;
  adClickVisitors: number | null;
  targetJobFields: string[];
  targetMatch: { matchedMembers: number; members: number; rate: number | null };
  byGrade: { grade: string | null; label: string; memberUniqueVisitors: number }[];
}

/** 운영자가 쓴 인사이트(BE LC-3657). `published` 가 거짓이면 운영자만 보는 임시 저장. */
export interface ReportInsight {
  title: string;
  body: string;
  published: boolean;
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
    /** 상품 정가(원). 견적 문의 상품은 null. 비용 효율의 광고비다. */
    price: number | null;
  };
  from: string;
  to: string;
  collectedSince: string;
  summary: ReportSummary;
  daily: ReportDaily[];
  exposures: ReportExposure[];
  targets: ReportTarget[];
  /** 로그인 회원만 센 희망 직무별 나눔. */
  byJobField: ReportJobField[];
  audience: ReportAudience;
  /** 인사이트 배포(LC-3657) 전 응답에는 없다. */
  insights?: ReportInsight[];
}

/** 목의 수집 시작일. 이보다 앞 날짜는 모두 0 이고 화면이 `집계 전` 으로 적는다. */
const COLLECTED_SINCE = '2026-11-08';
/** 오공고 화면에 노출하는 카테고리만 리포트가 있다. 인스타·카카오는 집계 대상이 아니다(D8). */
const REPORTABLE: readonly string[] = ['BANNER', 'JOB_POSTING'];

function unavailableReason(product: StoredContractProduct): ReportUnavailableReason | null {
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
  uniqueImpressions: number;
  adClicks: number;
  views: number;
  uniqueVisitors: number;
  memberViews: number;
  ctaClicks: number;
  ctaUniqueVisitors: number;
  avgScrollPercent: number | null;
  avgDurationSeconds: number | null;
}

/**
 * 소재가 상세 숫자를 얼마나 갖는지. 광고 카드는 다 갖는다. 배너는 스크롤·체류가 없고(계약 5절), 링크가 공고·부트캠프 상세가
 * 아니면 상세 조회·CTA 도 없다.
 */
type DetailKind = 'full' | 'noScroll' | 'none';

const DETAIL_LINK = /^\/(jobs|bootcamps)\/\d+/;

function detailKind(category: string, linkUrl: string | null | undefined): DetailKind {
  if (category !== 'BANNER') return 'full';
  return linkUrl && DETAIL_LINK.test(linkUrl) ? 'noScroll' : 'none';
}

/** 날짜·소재 한 칸. 수집 전 날과 일주일에 하루쯤은 0 이다(데이터 없는 날). */
function dayExposureRow(
  date: string,
  exposure: { id: number; name: string },
  kind: DetailKind,
): DayExposureRow {
  const empty = date < COLLECTED_SINCE || noise(date, exposure.id, 'empty') < 0.12;
  const impressions = empty ? 0 : Math.round(300 + noise(date, exposure.id, 'imp') * 600);
  const adClicks = Math.round(impressions * (0.008 + noise(date, exposure.id, 'ctr') * 0.022));
  const views =
    kind === 'none' ? 0 : Math.round(adClicks * (0.7 + noise(date, exposure.id, 'view') * 0.25));
  const scrolls = kind === 'full' && views > 0;
  const uniqueVisitors = Math.round(views * 0.85);
  const ctaClicks = Math.round(views * (0.1 + noise(date, exposure.id, 'cta') * 0.2));
  return {
    date,
    exposureId: exposure.id,
    exposureName: exposure.name,
    impressions,
    uniqueImpressions: Math.round(impressions * (0.55 + noise(date, exposure.id, 'uimp') * 0.2)),
    adClicks,
    views,
    uniqueVisitors,
    memberViews: Math.round(views * 0.5),
    ctaClicks,
    ctaUniqueVisitors: Math.round(ctaClicks * 0.85),
    avgScrollPercent: scrolls ? round1(45 + noise(date, exposure.id, 'scroll') * 35) : null,
    avgDurationSeconds: scrolls ? round1(20 + noise(date, exposure.id, 'dur') * 50) : null,
  };
}

/** 조회 수로 가중한 평균. 값이 있는 행이 없으면(조회 없음, 배너) null. */
function weightedAverage(all: DayExposureRow[], key: 'avgScrollPercent' | 'avgDurationSeconds') {
  const rows = all.filter((row) => row[key] !== null);
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
      dayExposureRow(
        date,
        { id: exposure.id, name: exposureName(exposure) },
        detailKind(product.category, exposure.linkUrl),
      ),
    ),
  );
  return { from, to, rows };
}

/** 배너는 노출 이름, 광고 카드는 이름이 없어 띄운 공고의 `<제목> · <회사명>` 이다(계약 5절). */
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
  return content ? `${content.title} · ${content.companyName}` : `소재 #${exposure.id}`;
}

const REPORT = `${CONTRACTS}/:contractId/products/:contractProductId`;

/** 상품 리포트 본문. 리포트를 열 수 없으면 오류 응답이다. 계약 전체 합계도 이것을 상품마다 부른다. */
function buildReport(
  params: Record<string, unknown>,
  url: URL,
): AdminContractProductReport | Response {
  const input = reportInput(params, url);
  if (input instanceof Response) return input;
  const contract = findContract(params.contractId) as StoredContract;
  const cp = contract.products.find(
    (item) => item.contractProductId === Number(params.contractProductId),
  ) as StoredContractProduct;
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
    // 하루 한 번씩 센 값이라 날짜 합이 기간 값이다.
    uniqueImpressions: rows.reduce((sum, row) => sum + row.uniqueImpressions, 0),
    adClicks,
    adClickRate: rate(adClicks, impressions),
    ...detail,
    uniqueVisitors,
    memberUniqueVisitors: Math.round(uniqueVisitors * 0.55),
    ctaUniqueVisitors,
    ctaUniqueMembers: Math.round(ctaUniqueVisitors * 0.6),
    ctaClickRate: rate(ctaUniqueVisitors, uniqueVisitors),
    scrollFunnel:
      cp.category === 'BANNER'
        ? null
        : SCROLL_STEPS.map(([threshold, share]) => {
            const visitors = Math.round(uniqueVisitors * share);
            return { threshold, visitors, rate: rate(visitors, uniqueVisitors) };
          }),
  };

  const daily: ReportDaily[] = datesBetween(from, to).map((date) => {
    const day = rows.filter((row) => row.date === date);
    return {
      date,
      impressions: day.reduce((sum, row) => sum + row.impressions, 0),
      uniqueImpressions: day.reduce((sum, row) => sum + row.uniqueImpressions, 0),
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
        saves: Math.round(views * 0.09),
        shares: Math.round(views * 0.03),
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

  return {
    product: {
      contractProductId: cp.contractProductId,
      productId: cp.productId,
      category: cp.category,
      position: product?.position ?? null,
      name: cp.productName,
      startDate: cp.startDate as string,
      endDate: cp.endDate as string,
      price: product?.price ?? null,
    },
    from,
    to,
    collectedSince: COLLECTED_SINCE,
    summary,
    daily,
    exposures,
    targets,
    byJobField: jobFieldBreakdown(cp.contractProductId, summary),
    audience: audienceOf(cp.category === 'BANNER', summary),
    insights: insightStore.get(cp.contractProductId) ?? [],
  };
}

/** 학년별 회원 몫. 학년을 입력하지 않은 회원이 맨 뒤다. */
const GRADE_SHARES: [string | null, string, number][] = [
  ['FOURTH', '4학년', 0.38],
  ['THIRD', '3학년', 0.24],
  ['GRADUATE', '졸업생', 0.16],
  ['SECOND', '2학년', 0.1],
  [null, '학년 미설정', 0.12],
];

function audienceOf(banner: boolean, summary: ReportSummary): ReportAudience {
  const reach = Math.round(summary.impressions * 0.55);
  const members = summary.memberUniqueVisitors;
  const matched = Math.round(members * 0.42);
  const targetJobFields = banner ? [] : ['IT_DEVELOPMENT'];
  return {
    reach: reach > 0 ? reach : null,
    avgFrequency: reach > 0 ? round1(summary.impressions / reach) : null,
    adClickVisitors: reach > 0 ? Math.round(summary.adClicks * 0.85) : null,
    targetJobFields,
    targetMatch: {
      matchedMembers: targetJobFields.length > 0 ? matched : 0,
      members,
      rate: targetJobFields.length > 0 ? rate(matched, members) : null,
    },
    byGrade: GRADE_SHARES.map(([grade, label, share]) => ({
      grade,
      label,
      memberUniqueVisitors: Math.round(members * share),
    })).filter((row) => row.memberUniqueVisitors > 0),
  };
}

const INSIGHT_STORAGE_KEY = 'ogonggo.mock.admin.reportInsights';

/** 계약 상품 id → 인사이트. 저장하면 `localStorage` 에도 둬서 새로고침해도 남는다. */
const insightStore: Map<number, ReportInsight[]> = (() => {
  try {
    const raw = localStorage.getItem(INSIGHT_STORAGE_KEY);
    return new Map(raw ? (JSON.parse(raw) as [number, ReportInsight[]][]) : []);
  } catch {
    return new Map();
  }
})();

function saveInsights() {
  try {
    localStorage.setItem(INSIGHT_STORAGE_KEY, JSON.stringify([...insightStore]));
  } catch {
    // 저장소를 못 쓰는 환경에서는 새로고침 전까지만 남는다.
  }
}

/**
 * 희망 직무별 나눔(계약 6.1). 로그인 회원만, 직무가 여럿이면 각 직무에 한 번씩 센다. 직무가 없는 회원은 `jobField: null`.
 * 목은 상품마다 직무 다섯 개를 골라 회원 숫자를 나눈다. 큰 순서다.
 */
function jobFieldBreakdown(contractProductId: number, summary: ReportSummary): ReportJobField[] {
  const options = enumOptions('JobField');
  const picked = [0, 1, 2, 3, 4].map(
    (index) => options[Math.floor(noise(contractProductId, 'field', index) * options.length)],
  );
  const unique = [
    ...new Map(picked.flatMap((item) => (item ? [[item.value, item]] : []))).values(),
  ];
  const clickMembers = Math.round(summary.adClicks * 0.4);
  const rows = [
    ...unique.map((item) => ({ jobField: item.value as string | null, label: item.label })),
    { jobField: null, label: '직무 미설정' },
  ].map((field, index) => {
    const share =
      field.jobField === null ? 0.06 : 0.12 + noise(contractProductId, field.jobField, index) * 0.3;
    return {
      ...field,
      memberUniqueVisitors: Math.round(summary.memberUniqueVisitors * share),
      memberViews: Math.round(summary.memberViews * share),
      ctaUniqueMembers: Math.round(summary.ctaUniqueMembers * share),
      adClickMembers: Math.round(clickMembers * share),
    };
  });
  return rows
    .filter((row) => row.memberUniqueVisitors > 0 || row.adClickMembers > 0)
    .sort(
      (a, b) =>
        b.memberUniqueVisitors - a.memberUniqueVisitors || b.adClickMembers - a.adClickMembers,
    );
}

export interface AdminContractReportSummary {
  total: {
    impressions: number;
    uniqueImpressions: number;
    adClicks: number;
    adClickRate: number | null;
    views: number;
    ctaClicks: number;
  };
  products: {
    contractProductId: number;
    category: string;
    position: string | null;
    name: string;
    startDate: string;
    endDate: string;
    impressions: number;
    uniqueImpressions: number;
    adClicks: number;
    views: number;
    ctaClicks: number;
  }[];
}

/** 계약 전체 합계(계약 6.2). 리포트를 열 수 있는 상품만, 각 상품 기간 전체를 합친다. */
const reportSummaryHandler = http.get(`${CONTRACTS}/:contractId/report-summary`, ({ params }) => {
  const contract = findContract(params.contractId);
  if (!contract) return contractNotFound();
  const url = new URL('http://mock/report');
  const products = contract.products
    .filter((cp) => unavailableReason(cp) === null)
    .flatMap((cp) => {
      const report = buildReport(
        { contractId: contract.id, contractProductId: cp.contractProductId },
        url,
      );
      if (report instanceof Response) return [];
      const { summary, product } = report;
      return [
        {
          contractProductId: product.contractProductId,
          category: product.category,
          position: product.position,
          name: product.name,
          startDate: product.startDate,
          endDate: product.endDate,
          impressions: summary.impressions,
          uniqueImpressions: summary.uniqueImpressions,
          adClicks: summary.adClicks,
          views: summary.views,
          ctaClicks: summary.ctaClicks,
        },
      ];
    });
  const sum = (key: 'impressions' | 'uniqueImpressions' | 'adClicks' | 'views' | 'ctaClicks') =>
    products.reduce((total, item) => total + item[key], 0);
  const body: AdminContractReportSummary = {
    total: {
      impressions: sum('impressions'),
      uniqueImpressions: sum('uniqueImpressions'),
      adClicks: sum('adClicks'),
      adClickRate: rate(sum('adClicks'), sum('impressions')),
      views: sum('views'),
      ctaClicks: sum('ctaClicks'),
    },
    products,
  };
  return HttpResponse.json(ok(body), { status: 200 });
});

const reportHandler = http.get(`${REPORT}/report`, ({ params, request }) => {
  const body = buildReport(params, new URL(request.url));
  if (body instanceof Response) return body;
  return HttpResponse.json(ok(body), { status: 200 });
});

/** 인사이트를 통째로 바꾼다. BE 와 같이 6개를 넘거나 제목·본문이 비면 400. */
const replaceInsightsHandler = http.put(
  `${REPORT}/report-insights`,
  async ({ params, request }) => {
    const body = (await request.json()) as {
      insights?: { title?: string; body?: string }[];
      published?: boolean;
    };
    const items = body.insights ?? [];
    const invalid =
      items.length > 6 ||
      items.some(
        (item) =>
          !item.title?.trim() ||
          !item.body?.trim() ||
          item.title.length > 60 ||
          item.body.length > 500,
      );
    if (invalid || typeof body.published !== 'boolean') {
      return HttpResponse.json(
        { status: 400, code: 'BAD_REQUEST', message: '인사이트 입력이 올바르지 않습니다.' },
        { status: 400 },
      );
    }
    const saved = items.map((item) => ({
      title: (item.title as string).trim(),
      body: (item.body as string).trim(),
      published: body.published as boolean,
    }));
    insightStore.set(Number(params.contractProductId), saved);
    saveInsights();
    return HttpResponse.json(ok(saved), { status: 200 });
  },
);

const CSV_COLUMNS = [
  'date',
  'exposureId',
  'exposureName',
  'impressions',
  'uniqueImpressions',
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
  replaceInsightsHandler,
  reportSummaryHandler,
];
