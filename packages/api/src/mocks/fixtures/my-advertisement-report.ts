import type { MyContractProductFixture } from './my-advertisement-contracts';

/**
 * 상품별 리포트 목(`광고-리포트-API-계약-2026-11-19.md` 3절). 응답 모양은 그 계약을 그대로 따른다. 코드젠 전이라 타입도
 * 여기서 적는다 — Push 3 배포 뒤 `api-codegen` 이 만든 타입으로 바꾼다(task 7.1).
 *
 * 숫자는 날짜·소재 id 로 정해지는 가짜 난수라 새로 고쳐도 같다. 들어 있는 경우:
 * - 수집 시작일(`COLLECTED_SINCE`) 이전 날짜는 0 이고 화면이 "집계 전" 으로 적는다. 홈 상단 배너(상품 11)는 앞 사흘이,
 *   끝난 부트캠프 배너(상품 21)는 기간 전체가 그렇다
 * - 데이터 없는 날(`zeroDays`)은 모든 칸이 0 이다
 * - 진행 중인 상품은 오늘까지만 준다
 */

export interface MockReportMetrics {
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

export interface MockReportDailyRow extends MockReportMetrics {
  date: string;
}

export interface MockReportCsvRow extends MockReportDailyRow {
  exposureId: number;
  exposureName: string;
}

type Source = 'AD_CARD' | 'BANNER' | 'LIST' | 'SEARCH' | 'DIRECT' | 'EXTERNAL' | 'OTHER';

export interface MockReport {
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
  summary: {
    impressions: number;
    adClicks: number;
    adClickRate: number | null;
    views: number;
    uniqueVisitors: number;
    memberViews: number;
    memberUniqueVisitors: number;
    ctaClicks: number;
    ctaUniqueVisitors: number;
    ctaUniqueMembers: number;
    ctaClickRate: number | null;
    avgScrollPercent: number | null;
    /** 스크롤 깊이 깔때기. 0·25·50·75·100% 단계. 0% 는 순 방문자 전체. 방문자가 없으면 `rate` 가 null. */
    scrollFunnel: { threshold: 0 | 25 | 50 | 75 | 100; visitors: number; rate: number | null }[];
    avgDurationSeconds: number | null;
  };
  daily: MockReportDailyRow[];
  exposures: {
    exposureId: number;
    name: string;
    impressions: number;
    adClicks: number;
    adClickRate: number | null;
  }[];
  targets: {
    targetType: 'JOB' | 'BOOTCAMP';
    targetId: number;
    title: string;
    total: Omit<MockReportMetrics, 'impressions' | 'adClicks'>;
    bySource: { source: Source; views: number; ctaClicks: number }[];
  }[];
}

/** 이벤트 수집을 시작한 날. 이 앞은 "집계 전" 이다. */
export const COLLECTED_SINCE = '2026-11-04';

interface ReportPlan {
  /** 리포트 응답의 `product.position`. 광고 공고 자리(`JOB_LIST`)는 계약 상세의 enum 에 아직 없다. */
  position: string | null;
  /** 이 상품의 노출이 상세로 데려온 유입 경로. */
  source: Source;
  exposures: { exposureId: number; name: string; weight: number }[];
  /** 하루 노출 수의 기준. 소재마다 `weight` 를 곱한다. */
  dailyImpressions: number;
  zeroDays: string[];
  target: { targetType: 'JOB' | 'BOOTCAMP'; targetId: number; title: string };
}

const PLANS: Record<number, ReportPlan> = {
  11: {
    position: 'JOB_HOME_TOP_BANNER',
    source: 'BANNER',
    exposures: [
      { exposureId: 31, name: '11월 홈 상단 A', weight: 0.6 },
      { exposureId: 32, name: '11월 홈 상단 B', weight: 0.4 },
    ],
    dailyImpressions: 1400,
    zeroDays: ['2026-11-09'],
    target: { targetType: 'JOB', targetId: 15818, title: '2027 상반기 신입 백엔드 개발자' },
  },
  12: {
    position: 'JOB_LIST',
    source: 'AD_CARD',
    exposures: [{ exposureId: 41, name: '채용공고 목록 광고 카드', weight: 1 }],
    dailyImpressions: 2600,
    zeroDays: ['2026-11-12'],
    target: { targetType: 'JOB', targetId: 15818, title: '2027 상반기 신입 백엔드 개발자' },
  },
  21: {
    position: 'BOOTCAMP_LIST_TOP_BANNER',
    source: 'BANNER',
    exposures: [{ exposureId: 51, name: '10월 부트캠프 목록 상단', weight: 1 }],
    dailyImpressions: 900,
    zeroDays: [],
    target: { targetType: 'BOOTCAMP', targetId: 501, title: '프론트엔드 부트캠프 12기' },
  },
};

/** 문자열로 정해지는 0 이상 1 미만의 수. 같은 입력이면 늘 같다. */
function noise(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

const between = (key: string, min: number, max: number) => min + noise(key) * (max - min);

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) dates.push(date);
  return dates;
}

/** 오늘(KST). */
export function todayKst(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

const ZERO: MockReportMetrics = {
  impressions: 0,
  adClicks: 0,
  views: 0,
  uniqueVisitors: 0,
  memberViews: 0,
  ctaClicks: 0,
  ctaUniqueVisitors: 0,
  avgScrollPercent: 0,
  avgDurationSeconds: 0,
};

/** 한 소재의 하루 숫자. */
function exposureDay(plan: ReportPlan, exposure: ReportPlan['exposures'][number], date: string) {
  if (date < COLLECTED_SINCE || plan.zeroDays.includes(date)) return { ...ZERO };
  const key = `${exposure.exposureId}:${date}`;
  const impressions = Math.round(plan.dailyImpressions * exposure.weight * between(key, 0.7, 1.3));
  const adClicks = Math.round(impressions * between(`${key}:ctr`, 0.012, 0.045));
  const views = Math.round(adClicks * between(`${key}:view`, 0.7, 0.9));
  const uniqueVisitors = Math.round(views * between(`${key}:uv`, 0.8, 0.95));
  const memberViews = Math.round(views * between(`${key}:member`, 0.4, 0.6));
  const ctaClicks = Math.round(views * between(`${key}:cta`, 0.12, 0.3));
  const ctaUniqueVisitors = Math.min(
    uniqueVisitors,
    Math.round(ctaClicks * between(`${key}:ctauv`, 0.8, 1)),
  );
  return {
    impressions,
    adClicks,
    views,
    uniqueVisitors,
    memberViews,
    ctaClicks,
    ctaUniqueVisitors,
    avgScrollPercent: views > 0 ? Math.round(between(`${key}:scroll`, 45, 80) * 10) / 10 : 0,
    avgDurationSeconds: views > 0 ? Math.round(between(`${key}:dur`, 25, 60) * 10) / 10 : 0,
  };
}

const rate = (numerator: number, denominator: number) =>
  denominator > 0 ? Math.round((numerator / denominator) * 10000) / 10000 : null;

/** 여러 줄을 더한다. 평균 스크롤·체류는 조회수로 가중 평균한다. 조회가 없으면 null. */
function sum(rows: MockReportMetrics[]): MockReportMetrics {
  const total = rows.reduce<MockReportMetrics>(
    (acc, row) => ({
      impressions: acc.impressions + row.impressions,
      adClicks: acc.adClicks + row.adClicks,
      views: acc.views + row.views,
      uniqueVisitors: acc.uniqueVisitors + row.uniqueVisitors,
      memberViews: acc.memberViews + row.memberViews,
      ctaClicks: acc.ctaClicks + row.ctaClicks,
      ctaUniqueVisitors: acc.ctaUniqueVisitors + row.ctaUniqueVisitors,
      avgScrollPercent: (acc.avgScrollPercent ?? 0) + (row.avgScrollPercent ?? 0) * row.views,
      avgDurationSeconds: (acc.avgDurationSeconds ?? 0) + (row.avgDurationSeconds ?? 0) * row.views,
    }),
    { ...ZERO },
  );
  const average = (weighted: number | null) =>
    total.views > 0 ? Math.round(((weighted ?? 0) / total.views) * 10) / 10 : null;
  return {
    ...total,
    avgScrollPercent: average(total.avgScrollPercent),
    avgDurationSeconds: average(total.avgDurationSeconds),
  };
}

/** 하루 합계. 없는 날은 평균도 0 이다(계약: "없는 날은 0"). */
const dayTotal = (rows: MockReportMetrics[]): MockReportMetrics => {
  const total = sum(rows);
  return {
    ...total,
    avgScrollPercent: total.avgScrollPercent ?? 0,
    avgDurationSeconds: total.avgDurationSeconds ?? 0,
  };
};

/** 리포트를 열 수 있는 상품이면 기간(자르기 전)과 계획을 준다. */
export function reportPlanOf(product: MyContractProductFixture) {
  const plan = PLANS[product.contractProductId];
  if (!plan || !product.reportAvailable || !product.startDate || !product.endDate) return null;
  return { plan, startDate: product.startDate, endDate: product.endDate };
}

/**
 * `from`·`to` 를 상품 기간 안으로 자른다. 생략하면 상품 기간 전체이고 진행 중이면 오늘까지다. 잘라서 비면 null.
 */
export function clipPeriod(
  startDate: string,
  endDate: string,
  from: string | null,
  to: string | null,
): { from: string; to: string } | null {
  const last = endDate < todayKst() ? endDate : todayKst();
  const clippedFrom = from && from > startDate ? from : startDate;
  const clippedTo = to && to < last ? to : last;
  return clippedFrom <= clippedTo ? { from: clippedFrom, to: clippedTo } : null;
}

/** CSV 행: 날짜별·소재별. */
export function reportCsvRows(product: MyContractProductFixture, from: string, to: string) {
  const found = reportPlanOf(product);
  if (!found) return [];
  const { plan } = found;
  return datesBetween(from, to).flatMap((date) =>
    plan.exposures.map((exposure): MockReportCsvRow => ({
      date,
      exposureId: exposure.exposureId,
      exposureName: exposure.name,
      ...exposureDay(plan, exposure, date),
    })),
  );
}

export function buildReport(
  product: MyContractProductFixture,
  from: string,
  to: string,
): MockReport | null {
  const found = reportPlanOf(product);
  if (!found) return null;
  const { plan, startDate, endDate } = found;
  const dates = datesBetween(from, to);
  const cells = dates.map((date) =>
    plan.exposures.map((exposure) => exposureDay(plan, exposure, date)),
  );
  const daily = dates.map((date, i): MockReportDailyRow => ({ date, ...dayTotal(cells[i]!) }));
  const total = sum(cells.flat());

  // 대상 공고 전체 숫자: 이 상품이 데려온 몫에 다른 경로(일반 목록·검색·외부)를 더한다.
  const otherSources = (['LIST', 'SEARCH', 'EXTERNAL'] as const).map((source) => {
    const views = dates
      .filter((date) => date >= COLLECTED_SINCE)
      .reduce((acc, date) => {
        const base = source === 'LIST' ? 30 : source === 'SEARCH' ? 6 : 8;
        return (
          acc + Math.round(base * between(`${plan.target.targetId}:${source}:${date}`, 0.5, 1.5))
        );
      }, 0);
    return { source, views, ctaClicks: Math.round(views * 0.12) };
  });
  const bySource = [
    { source: plan.source, views: total.views, ctaClicks: total.ctaClicks },
    ...otherSources,
  ];
  const targetViews = bySource.reduce((acc, row) => acc + row.views, 0);
  const targetUnique = Math.round(targetViews * 0.8);
  // 기간 안의 서로 다른 방문자는 날마다 더한 것보다 적다.
  const uniqueVisitors = Math.round(total.uniqueVisitors * 0.85);
  // 깊이마다 남는 몫. 상품마다 조금씩 다르게 한다.
  const keep = [1, 0.9, 0.7, 0.45, 0.2].map((share, i) =>
    i === 0
      ? 1
      : Math.min(1, share * between(`${product.contractProductId}:funnel:${i}`, 0.9, 1.1)),
  );
  const scrollFunnel = ([0, 25, 50, 75, 100] as const).map((threshold, i) => {
    const visitors = Math.round(uniqueVisitors * keep[i]!);
    return { threshold, visitors, rate: rate(visitors, uniqueVisitors) };
  });

  return {
    product: {
      contractProductId: product.contractProductId,
      productId: product.productId,
      category: product.category,
      position: plan.position,
      name: product.productName,
      startDate,
      endDate,
    },
    from,
    to,
    collectedSince: COLLECTED_SINCE,
    summary: {
      impressions: total.impressions,
      adClicks: total.adClicks,
      adClickRate: rate(total.adClicks, total.impressions),
      views: total.views,
      uniqueVisitors,
      memberViews: total.memberViews,
      memberUniqueVisitors: Math.round(total.memberViews * 0.75),
      ctaClicks: total.ctaClicks,
      ctaUniqueVisitors: Math.round(total.ctaUniqueVisitors * 0.85),
      ctaUniqueMembers: Math.round(total.ctaUniqueVisitors * 0.5),
      ctaClickRate: rate(total.ctaUniqueVisitors, total.uniqueVisitors),
      avgScrollPercent: total.avgScrollPercent,
      scrollFunnel,
      avgDurationSeconds: total.avgDurationSeconds,
    },
    daily,
    exposures: plan.exposures.map((exposure, index) => {
      const own = sum(cells.map((day) => day[index]!));
      return {
        exposureId: exposure.exposureId,
        name: exposure.name,
        impressions: own.impressions,
        adClicks: own.adClicks,
        adClickRate: rate(own.adClicks, own.impressions),
      };
    }),
    targets: [
      {
        ...plan.target,
        total: {
          views: targetViews,
          uniqueVisitors: targetUnique,
          memberViews: Math.round(targetViews * 0.5),
          ctaClicks: bySource.reduce((acc, row) => acc + row.ctaClicks, 0),
          ctaUniqueVisitors: Math.round(targetUnique * 0.15),
          avgScrollPercent: targetViews > 0 ? 58 : null,
          avgDurationSeconds: targetViews > 0 ? 35.4 : null,
        },
        bySource,
      },
    ],
  };
}

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

/** `report.csv` 본문. BOM 을 앞에 붙인다(엑셀이 UTF-8 로 연다). */
export function toReportCsv(rows: MockReportCsvRow[]): string {
  const escape = (value: unknown) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [
    CSV_COLUMNS.join(','),
    ...rows.map((row) => CSV_COLUMNS.map((column) => escape(row[column])).join(',')),
  ];
  return `﻿${lines.join('\n')}\n`;
}
