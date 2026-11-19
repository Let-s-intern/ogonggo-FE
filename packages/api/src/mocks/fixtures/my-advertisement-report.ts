import { enumLabel } from '../../enums';
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
  /** 같은 방문자·같은 노출을 하루 한 번으로 센 노출(계약 6.1). */
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
    uniqueImpressions: number;
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
    /** 배너 상품은 null(계약 5절: 배너는 상세 페이지가 아니라 스크롤·체류를 보이지 않는다). */
    scrollFunnel:
      | { threshold: 0 | 25 | 50 | 75 | 100; visitors: number; rate: number | null }[]
      | null;
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
    total: Omit<MockReportMetrics, 'impressions' | 'uniqueImpressions' | 'adClicks'>;
    bySource: { source: Source; views: number; ctaClicks: number }[];
  }[];
  /** 로그인 회원의 희망 직무별 나눔(계약 6.1). 회원 순 방문자 큰 순. */
  byJobField: MockJobFieldRow[];
}

export interface MockJobFieldRow {
  jobField: string | null;
  label: string;
  memberUniqueVisitors: number;
  memberViews: number;
  ctaUniqueMembers: number;
  adClickMembers: number;
}

/**
 * 희망 직무 몫. 값은 희망 직무 enum(`JobRole`, 회원 프로필의 희망 직무)이고 라벨은 enum 카탈로그에서 읽는다. 직무가 여럿인
 * 회원은 직무마다 한 번씩 세므로 몫의 합이 1 을 넘는다.
 */
const JOB_FIELD_SHARES: readonly [string | null, number][] = [
  ['IT_BACKEND', 0.42],
  ['IT_FRONTEND_FULLSTACK', 0.24],
  ['AI_DATA_ENGINEER', 0.15],
  ['IT_INFRA_DEVOPS', 0.11],
  [null, 0.13],
];

function jobFieldRows(
  key: string,
  members: { uniqueVisitors: number; views: number; ctaUnique: number; adClicks: number },
): MockJobFieldRow[] {
  if (members.uniqueVisitors === 0) return [];
  return JOB_FIELD_SHARES.map(([jobField, share]) => {
    const k = share * between(`${key}:${jobField}`, 0.85, 1.15);
    return {
      jobField,
      label: jobField ? enumLabel('JobRole', jobField) : '직무 미설정',
      memberUniqueVisitors: Math.round(members.uniqueVisitors * k),
      memberViews: Math.round(members.views * k),
      ctaUniqueMembers: Math.round(members.ctaUnique * k),
      adClickMembers: Math.round(members.adClicks * k),
    };
  }).sort((a, b) => b.memberUniqueVisitors - a.memberUniqueVisitors);
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
  /** 광고 공고 상품의 대상 공고 회사명. 광고 공고 소재 이름(`<제목> · <회사명>`, 계약 5절)에 쓴다. 배너는 null. */
  targetCompanyName: string | null;
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
    targetCompanyName: null,
  },
  12: {
    position: 'JOB_LIST',
    source: 'AD_CARD',
    exposures: [{ exposureId: 41, name: '채용공고 목록 광고 카드', weight: 1 }],
    dailyImpressions: 2600,
    zeroDays: ['2026-11-12'],
    target: { targetType: 'JOB', targetId: 15818, title: '2027 상반기 신입 백엔드 개발자' },
    targetCompanyName: '오공고 테스트 기업',
  },
  21: {
    position: 'BOOTCAMP_LIST_TOP_BANNER',
    source: 'BANNER',
    exposures: [{ exposureId: 51, name: '10월 부트캠프 목록 상단', weight: 1 }],
    dailyImpressions: 900,
    zeroDays: [],
    target: { targetType: 'BOOTCAMP', targetId: 501, title: '프론트엔드 부트캠프 12기' },
    targetCompanyName: null,
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
  uniqueImpressions: 0,
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
    uniqueImpressions: Math.round(impressions * between(`${key}:uimp`, 0.55, 0.75)),
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
      uniqueImpressions: acc.uniqueImpressions + row.uniqueImpressions,
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

/** 배너 상품인지. 배너는 스크롤·체류 칸을 null 로 준다(계약 5절). */
const isBanner = (product: MyContractProductFixture) => product.category === 'BANNER';

function withoutScroll<
  T extends { avgScrollPercent: number | null; avgDurationSeconds: number | null },
>(row: T): T {
  return { ...row, avgScrollPercent: null, avgDurationSeconds: null };
}

/** 소재 이름. 광고 공고 소재는 대상 공고 제목 · 회사명이다(계약 5절). */
function exposureNameOf(plan: ReportPlan, exposure: ReportPlan['exposures'][number]): string {
  return plan.targetCompanyName
    ? `${plan.target.title} · ${plan.targetCompanyName}`
    : exposure.name;
}

/** CSV 행: 날짜별·소재별. 배너는 스크롤·체류 열이 빈칸이다. */
export function reportCsvRows(product: MyContractProductFixture, from: string, to: string) {
  const found = reportPlanOf(product);
  if (!found) return [];
  const { plan } = found;
  return datesBetween(from, to).flatMap((date) =>
    plan.exposures.map((exposure): MockReportCsvRow => {
      const row: MockReportCsvRow = {
        date,
        exposureId: exposure.exposureId,
        exposureName: exposureNameOf(plan, exposure),
        ...exposureDay(plan, exposure, date),
      };
      return isBanner(product) ? withoutScroll(row) : row;
    }),
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
  const daily = dates.map((date, i): MockReportDailyRow => {
    const row = { date, ...dayTotal(cells[i]!) };
    return isBanner(product) ? withoutScroll(row) : row;
  });
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
      uniqueImpressions: total.uniqueImpressions,
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
      avgScrollPercent: isBanner(product) ? null : total.avgScrollPercent,
      scrollFunnel: isBanner(product) ? null : scrollFunnel,
      avgDurationSeconds: isBanner(product) ? null : total.avgDurationSeconds,
    },
    daily,
    exposures: plan.exposures.map((exposure, index) => {
      const own = sum(cells.map((day) => day[index]!));
      return {
        exposureId: exposure.exposureId,
        name: exposureNameOf(plan, exposure),
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
    byJobField: jobFieldRows(String(product.contractProductId), {
      uniqueVisitors: Math.round(total.memberViews * 0.75),
      views: total.memberViews,
      ctaUnique: Math.round(total.ctaUniqueVisitors * 0.5),
      // 광고를 누른 회원. 누른 사람의 절반쯤이 회원이라고 둔다.
      adClicks: Math.round(total.adClicks * 0.45),
    }),
  };
}

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

/** 대시보드 진행 중 광고 요약 한 줄(계약 4절). */
export interface MockActiveAd {
  contractId: number;
  contractProductId: number;
  category: string;
  position: string | null;
  name: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
  impressions: number;
  adClicks: number;
  adClickRate: number | null;
  views: number;
  ctaClicks: number;
  scroll50Rate: number | null;
  target: { targetType: 'JOB' | 'BOOTCAMP'; targetId: number; title: string } | null;
  collectedSince: string;
  daily: { date: string; impressions: number; adClicks: number; views: number }[];
}

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

/**
 * 오늘 게시 중이고 리포트를 열 수 있는 상품의 요약. 숫자는 상품 시작일~오늘의 `buildReport` 와 같다. 끝나는 날이
 * 가까운 순.
 */
export function buildActiveAds(
  contracts: { id: number; products: MyContractProductFixture[] }[],
): MockActiveAd[] {
  const today = todayKst();
  return contracts
    .flatMap((contract) =>
      contract.products.flatMap((product): MockActiveAd[] => {
        const found = reportPlanOf(product);
        if (!found || today < found.startDate || today > found.endDate) return [];
        const report = buildReport(product, found.startDate, today);
        if (!report) return [];
        const { plan } = found;
        const { summary } = report;
        return [
          {
            contractId: contract.id,
            contractProductId: product.contractProductId,
            category: product.category,
            position: plan.position,
            name: product.productName,
            startDate: found.startDate,
            endDate: found.endDate,
            daysLeft: daysBetween(today, found.endDate),
            impressions: summary.impressions,
            adClicks: summary.adClicks,
            adClickRate: summary.adClickRate,
            views: summary.views,
            ctaClicks: summary.ctaClicks,
            scroll50Rate: summary.scrollFunnel?.find((step) => step.threshold === 50)?.rate ?? null,
            target: product.category === 'JOB_POSTING' ? plan.target : null,
            collectedSince: COLLECTED_SINCE,
            daily: report.daily.map(({ date, impressions, adClicks, views }) => ({
              date,
              impressions,
              adClicks,
              views,
            })),
          },
        ];
      }),
    )
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
}

/** 계약 전체 합계(`report-summary`, 계약 6.2). 리포트를 열 수 있는 상품만, 각 상품 기간 전체(진행 중이면 오늘까지). */
export function buildReportSummary(products: MyContractProductFixture[]) {
  const rows = products.flatMap((product) => {
    const found = reportPlanOf(product);
    if (!found) return [];
    const period = clipPeriod(found.startDate, found.endDate, null, null);
    const report = period ? buildReport(product, period.from, period.to) : null;
    if (!report) return [];
    const { summary } = report;
    return [
      {
        contractProductId: product.contractProductId,
        category: product.category,
        position: found.plan.position,
        name: product.productName,
        startDate: found.startDate,
        endDate: found.endDate,
        impressions: summary.impressions,
        uniqueImpressions: summary.uniqueImpressions,
        adClicks: summary.adClicks,
        views: summary.views,
        ctaClicks: summary.ctaClicks,
      },
    ];
  });
  const add = (pick: (row: (typeof rows)[number]) => number) =>
    rows.reduce((acc, row) => acc + pick(row), 0);
  const impressions = add((row) => row.impressions);
  const adClicks = add((row) => row.adClicks);
  return {
    total: {
      impressions,
      uniqueImpressions: add((row) => row.uniqueImpressions),
      adClicks,
      adClickRate: rate(adClicks, impressions),
      views: add((row) => row.views),
      ctaClicks: add((row) => row.ctaClicks),
    },
    products: rows,
  };
}
