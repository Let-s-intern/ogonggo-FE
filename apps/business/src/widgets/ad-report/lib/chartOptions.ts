import type { EChartsCoreOption } from 'echarts/core';
import { shortDate } from '../model/format';
import type { ReportDailyRow } from '../model/types';

/** 어드민 통계(`apps/admin/src/pages/stats/lib/chartOptions.ts`)와 같은 색 순서·글꼴·축 모양. */
const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
const FONT_FAMILY = "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif";
const AXIS_LABEL = { color: '#6b7280', fontSize: 12 };
const GRID_LINE = { lineStyle: { color: '#ecedf0' } };

/**
 * 날짜별 추이. 노출은 수가 커서 왼쪽 축 막대로, 클릭·상세 조회·CTA 클릭은 오른쪽 축 선으로 그린다. 수집 시작일 앞은
 * 0 이 아니라 빈칸으로 두고 회색 칸에 "집계 전" 을 적는다 — 0 으로 그리면 숫자가 없었던 날로 읽힌다.
 */
export function trendOption(daily: ReportDailyRow[], collectedSince: string): EChartsCoreOption {
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
    grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
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
      line('광고 클릭', (row) => row.adClicks),
      line('상세 조회', (row) => row.views),
      line('CTA 클릭', (row) => row.ctaClicks),
    ],
  };
}
