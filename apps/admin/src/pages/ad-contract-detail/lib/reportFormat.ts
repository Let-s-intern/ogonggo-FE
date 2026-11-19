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

/** 0~1 소수를 `12.3%` 로. 분모가 0 이라 `null` 이면 `-`. */
export const formatRate = (value: number | null | undefined) =>
  value == null ? '-' : `${(value * 100).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}%`;

export const formatPercent = (value: number | null | undefined) =>
  value == null ? '-' : `${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}%`;

export const formatSeconds = (value: number | null | undefined) =>
  value == null ? '-' : `${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}초`;

export function addDays(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`) + days * 24 * 60 * 60 * 1000;
  return new Date(time).toISOString().slice(0, 10);
}

/** 수집 시작일 앞 날짜는 숫자가 없다. 0 이 아니라 `집계 전` 이다. */
export const isBeforeCollection = (report: ContractProductReport, date: string) =>
  date < report.collectedSince;

type ScrollStep = ContractProductReport['summary']['scrollFunnel'][number];

/** 깔때기 단계 이름. 0% 는 상세를 연 순 방문자 전체다. */
export const scrollStepLabel = (step: ScrollStep) =>
  step.threshold === 0 ? '상세를 연 방문자' : `${step.threshold}% 까지 내림`;

/** 단계 라벨 `N명 (xx%)`. */
export const scrollStepValue = (step: ScrollStep) =>
  `${formatCount(step.visitors)}명 (${formatRate(step.rate)})`;

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
        data: steps.map((step) => ({ name: scrollStepLabel(step), value: step.visitors })),
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
        name: '클릭·조회',
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
          ['소재 클릭', 'adClicks'],
          ['상세 조회', 'views'],
          ['CTA 클릭', 'ctaClicks'],
        ] as const
      ).map(([name, key]) => ({
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
