import type { EChartsCoreOption } from 'echarts/core';
import { shortDate } from '../model/format';
import type { ReportDailyRow, ScrollFunnelStep } from '../model/types';

/** 어드민 통계(`apps/admin/src/pages/stats/lib/chartOptions.ts`)와 같은 색 순서·글꼴·축 모양. */
const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
const FONT_FAMILY = "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif";
const AXIS_LABEL = { color: '#6b7280', fontSize: 12 };
const GRID_LINE = { lineStyle: { color: '#ecedf0' } };

/**
 * 날짜별 추이. 노출은 수가 커서 왼쪽 축 막대로, 클릭·상세 조회·CTA 클릭은 오른쪽 축 선으로 그린다. 수집 시작일 앞은
 * 0 이 아니라 빈칸으로 두고 회색 칸에 "집계 전" 을 적는다 — 0 으로 그리면 숫자가 없었던 날로 읽힌다.
 */
export function trendOption(
  daily: ReportDailyRow[],
  collectedSince: string,
  /** 상세 조회·CTA 클릭 선을 그릴지. 배너 링크가 공고 상세가 아니면 0 뿐이라 빼다. */
  withDetail = true,
): EChartsCoreOption {
  const dates = daily.map((row) => row.date);
  const before = (date: string) => date < collectedSince;
  const values = (pick: (row: ReportDailyRow) => number) =>
    daily.map((row) => (before(row.date) ? null : pick(row)));
  const pre = dates.filter(before);
  const showSymbol = dates.length <= 16;
  const line = (name: string, pick: (row: ReportDailyRow) => number) => ({
    name,
    type: 'line',
    yAxisIndex: 1,
    data: values(pick),
    showSymbol,
    symbolSize: 6,
    connectNulls: false,
  });

  return {
    color: COLORS,
    textStyle: { fontFamily: FONT_FAMILY },
    // ECharts 6 에서 `containLabel` 은 따로 등록해야 해서 같은 뜻의 `outerBounds*` 를 쓴다.
    grid: {
      left: 8,
      right: 8,
      top: 40,
      bottom: 8,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
    },
    legend: {
      top: 0,
      left: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 4,
      textStyle: AXIS_LABEL,
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: unknown) =>
        typeof value === 'number' ? value.toLocaleString('ko-KR') : '집계 전',
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { ...AXIS_LABEL, formatter: shortDate, hideOverlap: true },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#d1d5db' } },
    },
    yAxis: [
      { type: 'value', axisLabel: AXIS_LABEL, splitLine: GRID_LINE },
      { type: 'value', axisLabel: AXIS_LABEL, splitLine: { show: false } },
    ],
    series: [
      {
        name: '노출',
        type: 'bar',
        data: values((row) => row.impressions),
        barMaxWidth: 18,
        itemStyle: { color: '#c7dcf5', borderRadius: [3, 3, 0, 0] },
        markArea:
          pre.length > 0
            ? {
                silent: true,
                itemStyle: { color: 'rgba(156,163,175,0.12)' },
                label: { color: '#6b7280', fontSize: 12, position: 'insideTop' },
                data: [[{ name: '집계 전', xAxis: pre[0] }, { xAxis: pre.at(-1) }]],
              }
            : undefined,
      },
      line('클릭', (row) => row.adClicks),
      ...(withDetail
        ? [line('상세 조회', (row) => row.views), line('CTA 클릭', (row) => row.ctaClicks)]
        : []),
    ],
  };
}

/** 깔때기 단계 이름. 0% 는 상세를 연 순 방문자 전체다. */
export const funnelStepLabel = (threshold: number) =>
  threshold === 0 ? '상세를 연 방문자' : `${threshold}% 이상`;

/**
 * 스크롤 깊이 깔때기. 단계 순서(0 → 100%)를 그대로 위에서 아래로 그린다 — 정렬을 맡기면 값이 같은 단계끼리 순서가
 * 바뀔 수 있다. 칸 안에는 단계 이름과 사람 수를 적는다.
 */
export function scrollFunnelOption(steps: ScrollFunnelStep[]): EChartsCoreOption {
  return {
    textStyle: { fontFamily: FONT_FAMILY },
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value: number }) =>
        `${params.name}: ${params.value.toLocaleString('ko-KR')}명`,
    },
    series: [
      {
        type: 'funnel',
        sort: 'none',
        left: 0,
        right: 0,
        top: 4,
        bottom: 4,
        gap: 2,
        minSize: '18%',
        // 사람 수 비율대로 폭을 정한다. 최댓값은 0% 단계(순 방문자 전체)다.
        max: Math.max(1, steps[0]?.visitors ?? 0),
        label: {
          show: true,
          position: 'inside',
          color: '#ffffff',
          fontSize: 12,
          formatter: (params: { name: string; value: number }) =>
            `${params.name} ${params.value.toLocaleString('ko-KR')}명`,
        },
        itemStyle: { borderWidth: 0 },
        color: ['#1f5fb0', '#2a78d6', '#4f93e3', '#7aaeea', '#a5c9f1'],
        data: steps.map((step) => ({
          name: funnelStepLabel(step.threshold),
          value: step.visitors,
        })),
      },
    ],
  };
}

/**
 * 대시보드 카드의 작은 추이 그래프(2026-11-19 사용자 검수). 선 하나만 영역을 채운 꺾은선으로 그린다. 축·눈금·격자·점이 없고
 * 마지막 날만 점을 작게 찍는다. y 축은 0 에서 시작한다. 날짜는 부르는 쪽이 수집 시작일부터 넘기고, 숫자 없는 날은 0 으로
 * 이어 그린다.
 */
export function sparklineOption(
  dates: string[],
  name: string,
  values: number[],
): EChartsCoreOption {
  const last = values.length - 1;
  return {
    color: ['#2a78d6'],
    textStyle: { fontFamily: FONT_FAMILY },
    grid: { left: 0, right: 4, top: 6, bottom: 2 },
    tooltip: {
      trigger: 'axis',
      confine: true,
      valueFormatter: (value: unknown) =>
        typeof value === 'number' ? value.toLocaleString('ko-KR') : '-',
    },
    xAxis: { type: 'category', data: dates, show: false, boundaryGap: false },
    yAxis: { type: 'value', show: false, min: 0 },
    series: [
      {
        name,
        type: 'line',
        data: values.map((value, day) =>
          day === last ? { value, symbol: 'circle', symbolSize: 5 } : value,
        ),
        showSymbol: false,
        smooth: false,
        lineStyle: { width: 1.5 },
        areaStyle: { opacity: 0.12 },
      },
    ],
  };
}
