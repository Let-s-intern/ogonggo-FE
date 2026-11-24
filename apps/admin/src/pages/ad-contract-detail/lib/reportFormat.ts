import type { EChartsCoreOption } from 'echarts/core';
import type { ContractProductReport } from '@/entities/advertisement-contract/api/useContractReport';

/** 통계 화면(`pages/stats/lib/chartOptions.ts`)과 같은 색·글꼴. 순서대로 쓴다. */
const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
const FONT_FAMILY = "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif";
const AXIS_LABEL = { color: '#6b7280', fontSize: 12 };

export const SOURCE_LABELS: Record<string, string> = {
  AD_CARD: '광고 카드',
  BANNER: '배너',
  LIST: '일반 목록',
  SEARCH: '검색',
  EXTERNAL: '외부',
};

export const formatCount = (value: number | null | undefined) =>
  value == null ? '-' : value.toLocaleString('ko-KR');

/** 0~1 소수를 `12.3%` 로. 소수 한 자리로 고정한다(`2.0%`). 분모가 0 이라 `null` 이면 `-`. */
export const formatRate = (value: number | null | undefined) =>
  value == null
    ? '-'
    : `${(value * 100).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/** `2026-11-05` → `2026.11.05`. 날짜만 쓰는 곳은 모두 이 모양이다(노출 시각은 `formatKst`). */
export const formatDate = (date: string) => date.slice(0, 10).replaceAll('-', '.');

/** `2026.11.05 ~ 2026.11.18`. 둘 중 하나라도 없으면 `기간 미정`. */
export const formatDateRange = (start?: string | null, end?: string | null) =>
  start && end ? `${formatDate(start)} ~ ${formatDate(end)}` : '기간 미정';

export const formatPercent = (value: number | null | undefined) =>
  value == null ? '-' : `${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}%`;

export const formatSeconds = (value: number | null | undefined) =>
  value == null ? '-' : `${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}초`;

export function addDays(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`) + days * 24 * 60 * 60 * 1000;
  return new Date(time).toISOString().slice(0, 10);
}

/** 배너 상품. 배너는 상세 페이지가 아니라 스크롤·체류가 없다(API 계약 5절). */
export const isBannerReport = (report: ContractProductReport) =>
  report.product.category === 'BANNER';

/**
 * 상품 몫 상세 숫자(상세 조회·CTA)를 보일지. 광고 카드는 늘 보인다. 배너는 링크가 공고 상세일 때만 숫자가 생겨, 0 이면
 * 칸을 숨기고 안내 한 줄로 바꾼다.
 */
export const showsDetail = (report: ContractProductReport) =>
  !isBannerReport(report) || report.summary.views > 0;

/**
 * 광고를 눌러 들어온 것의 이름. 목업(2026-11-23)은 광고 카드를 눌러 공고를 연 것을 `조회`라 부르고, 지원 버튼을 누른 것은
 * `지원하기 클릭`이라 부른다. 배너는 공고 상세가 아니라 `클릭`이다.
 */
export const clickLabelOf = (report: ContractProductReport) =>
  isBannerReport(report) ? '클릭' : '조회';

/** `조회` → `조회율`, `클릭` → `클릭률`. */
export const rateLabelOf = (clickLabel: string) => (clickLabel === '클릭' ? '클릭률' : '조회율');

/** 분모가 0 이면 null. */
export const ratioOf = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null;

const DAY_MS = 24 * 60 * 60 * 1000;

/** 두 날짜(양 끝 포함) 사이 일수. */
export function inclusiveDays(from: string, to: string): number {
  const diff = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS;
  return Math.max(0, Math.round(diff) + 1);
}

const won = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;

export interface CostEfficiency {
  /** 리포트 기간 몫의 광고비(원). */
  cost: number;
  /** 정가 일부 기간 몫이면 `[리포트 일수, 게시 일수]`. */
  prorated: [number, number] | null;
  items: { label: string; value: string; hint: string }[];
}

/**
 * 비용 효율. 광고비는 상품 정가이고 무료 혜택도 정가로 환산한다(2026-11-23 목업). 정가가 없는 견적 문의 상품과 정가가
 * 0원(무료)인 상품은 null.
 * 기간을 좁히면 정가를 게시 일수로 나눠 리포트 일수만큼만 쓴다(하루치 숫자에 한 달 광고비를 나누면 단가가 부풀기 때문).
 */
export function costEfficiency(report: ContractProductReport): CostEfficiency | null {
  const price = report.product.price;
  if (price == null || price === 0) return null;
  const total = inclusiveDays(report.product.startDate, report.product.endDate);
  const days = inclusiveDays(report.from, report.to);
  const prorated = days > 0 && days < total ? ([days, total] as [number, number]) : null;
  const cost = prorated ? (price * days) / total : price;
  const { summary } = report;
  const banner = isBannerReport(report);
  const clickLabel = clickLabelOf(report);
  const per = (count: number) => (count > 0 ? won(cost / count) : '-');
  const items: CostEfficiency['items'] = [
    {
      label: '노출 1,000회당 비용',
      value: summary.impressions > 0 ? won((cost / summary.impressions) * 1000) : '-',
      hint: `광고비 ÷ ${formatCount(summary.impressions)} × 1,000`,
    },
    {
      label: `${clickLabel}당 비용`,
      value: per(summary.adClicks),
      hint: `광고비 ÷ ${clickLabel} ${formatCount(summary.adClicks)}`,
    },
  ];
  if (!banner || summary.ctaClicks > 0) {
    items.push({
      label: '지원하기 클릭당 비용',
      value: per(summary.ctaClicks),
      hint: `광고비 ÷ 지원하기 클릭 ${formatCount(summary.ctaClicks)}`,
    });
  }
  return { cost, prorated, items };
}

/** 학년 칸을 목업의 신분으로 묶는다. 1~4학년·5학년 이상은 재학, 졸업생은 졸업. 졸업 예정은 따로 받지 않아 나누지 못한다. */
export function statusCounts(byGrade: ContractProductReport['audience']['byGrade']) {
  const sum = (pick: (row: (typeof byGrade)[number]) => boolean) =>
    byGrade.filter(pick).reduce((acc, row) => acc + row.memberUniqueVisitors, 0);
  return {
    studying: sum((row) => row.grade != null && row.grade !== 'GRADUATE'),
    graduated: sum((row) => row.grade === 'GRADUATE'),
    unset: sum((row) => row.grade == null),
  };
}

/** 수집 시작일 앞 날짜는 숫자가 없다. 0 이 아니라 `집계 전` 이다. */
export const isBeforeCollection = (report: ContractProductReport, date: string) =>
  date < report.collectedSince;

type ScrollStep = NonNullable<ContractProductReport['summary']['scrollFunnel']>[number];

/** 깔때기 단계 이름. 0% 는 상세를 연 순 방문자 전체다. */
export const scrollStepLabel = (step: ScrollStep) =>
  step.threshold === 0
    ? '공고를 연 사람'
    : step.threshold === 100
      ? '끝까지'
      : `${step.threshold}%까지`;

/** 단계 라벨 `N명 (xx%)`. */
export const scrollStepValue = (step: ScrollStep) =>
  `${formatCount(step.visitors)}명 (${formatRate(step.rate)})`;

/**
 * 칸이 좁으면 흰 글자가 칸 밖 흰 바탕으로 넘쳐 보이지 않는다. 폭이 절반보다 좁은 칸은 흰 바탕의 진한 글자로 적는다.
 */
export function narrowFunnelLabel(ratio: number) {
  return ratio < 0.5
    ? {
        label: { color: '#1f2937', backgroundColor: '#ffffff', padding: [2, 6], borderRadius: 4 },
      }
    : {};
}

/**
 * 스크롤 깊이 깔때기. 단계 순서를 그대로 두고(`sort: none`), 폭은 0% 단계 방문자 수에 맞춘다. 라벨은 단계 이름과
 * `N명 (xx%)` 다.
 */
export function scrollFunnelOption(steps: ScrollStep[]): EChartsCoreOption {
  const max = Math.max(1, ...steps.map((step) => step.visitors));
  return {
    color: COLORS,
    textStyle: { fontFamily: FONT_FAMILY },
    tooltip: {
      trigger: 'item',
      formatter: (params: { dataIndex: number }) => {
        const step = steps[params.dataIndex];
        return step ? `${scrollStepLabel(step)}: ${scrollStepValue(step)}` : '';
      },
    },
    series: [
      {
        type: 'funnel',
        sort: 'none',
        min: 0,
        max,
        minSize: '8%',
        left: '5%',
        width: '90%',
        top: 8,
        bottom: 8,
        gap: 2,
        itemStyle: { color: COLORS[0], borderColor: '#ffffff', borderWidth: 1 },
        label: {
          show: true,
          position: 'inside',
          color: '#ffffff',
          fontSize: 12,
          formatter: (params: { dataIndex: number }) => {
            const step = steps[params.dataIndex];
            return step ? `${scrollStepLabel(step)}  ${scrollStepValue(step)}` : '';
          },
        },
        data: steps.map((step) => ({
          name: scrollStepLabel(step),
          value: step.visitors,
          ...narrowFunnelLabel(step.visitors / max),
        })),
      },
    ],
  };
}

/**
 * 희망 직무별 가로 막대. 위가 큰 값이다(응답이 큰 순이라 축을 뒤집는다). 값은 `metric` 한 가지 — 상세 숫자가 있으면 순 방문
 * 회원, 없으면(상세로 이어지지 않는 배너) 광고 클릭 회원이다.
 */
export function jobFieldChartOption(
  rows: ContractProductReport['byJobField'],
  metric: 'memberUniqueVisitors' | 'adClickMembers',
): EChartsCoreOption {
  const unit = metric === 'memberUniqueVisitors' ? '순 방문 회원' : '광고 클릭 회원';
  return {
    color: COLORS,
    textStyle: { fontFamily: FONT_FAMILY },
    grid: { top: 8, right: 56, bottom: 8, left: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: unknown) =>
        typeof value === 'number' ? `${value.toLocaleString('ko-KR')}명` : '-',
    },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((row) => row.label),
      axisLabel: AXIS_LABEL,
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: unit,
        type: 'bar',
        barMaxWidth: 18,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: '#374151',
          fontSize: 12,
          formatter: (params: { value: number }) => `${params.value.toLocaleString('ko-KR')}명`,
        },
        data: rows.map((row) => row[metric]),
      },
    ],
  };
}

/**
 * 날짜별 추이. 노출은 막대(왼쪽 축), 클릭·조회·CTA 는 선(오른쪽 축)이다 — 노출이 두 자릿수 크다. 집계 전 날짜는 값을 비워
 * 0 으로 내려앉지 않게 한다.
 */
export function dailyChartOption(report: ContractProductReport): EChartsCoreOption {
  const value = (date: string, number: number) =>
    isBeforeCollection(report, date) ? null : number;
  const days = report.daily;
  return {
    color: COLORS,
    textStyle: { fontFamily: FONT_FAMILY },
    grid: { top: 60, right: 48, bottom: 28, left: 56 },
    legend: { top: 0, left: 0, itemGap: 16, textStyle: { color: '#374151', fontSize: 12 } },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (number: unknown) =>
        typeof number === 'number' ? number.toLocaleString('ko-KR') : '집계 전',
    },
    xAxis: {
      type: 'category',
      data: days.map((day) => day.date),
      axisLabel: {
        ...AXIS_LABEL,
        formatter: (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`,
      },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      axisTick: { show: false },
    },
    // 배너가 상세 숫자 없이 클릭만 있으면 오른쪽 축 이름도 클릭이다.
    yAxis: [
      {
        type: 'value',
        name: '노출',
        nameTextStyle: { ...AXIS_LABEL, align: 'right' },
        axisLabel: AXIS_LABEL,
        splitLine: { lineStyle: { color: '#ecedf0' } },
      },
      {
        type: 'value',
        name: showsDetail(report) ? `${clickLabelOf(report)}·지원하기 클릭` : clickLabelOf(report),
        nameTextStyle: { ...AXIS_LABEL, align: 'left' },
        axisLabel: AXIS_LABEL,
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '노출',
        type: 'bar',
        barMaxWidth: 24,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: days.map((day) => value(day.date, day.impressions)),
      },
      ...(
        [
          [clickLabelOf(report), 'adClicks'],
          ['지원하기 클릭', 'ctaClicks'],
        ] as const
      )
        .filter(([, key]) => key === 'adClicks' || showsDetail(report))
        .map(([name, key]) => ({
          name,
          type: 'line',
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 7,
          showSymbol: days.length <= 31,
          lineStyle: { width: 2 },
          data: days.map((day) => value(day.date, day[key])),
        })),
    ],
  };
}
