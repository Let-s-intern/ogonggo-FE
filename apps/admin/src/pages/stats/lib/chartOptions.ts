import type { EChartsCoreOption } from 'echarts/core';
import type { RedashRow } from '@/shared/api/redash';

/**
 * 통계 화면 차트의 ECharts 옵션. 모든 차트가 같은 축·범례·툴팁 모양을 쓰도록 한 곳에서 만든다.
 *
 * 계열 색은 순서대로 고정해 쓴다. 필터로 계열 수가 줄어도 남은 계열의 색이 바뀌지 않게, 색은 계열의
 * 이름이 아니라 차트에 적은 순서에서 나온다. 여덟 색은 색각 이상에서도 이웃한 색끼리 구분되는지 확인한
 * 순서다 — 순서를 바꾸지 않는다.
 */
export const SERIES_COLORS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#6250d6',
  '#e34948',
];

/**
 * 앱 본문과 같은 글꼴. `inherit` 로 두면 ECharts 가 범례 글자 폭을 기본 글꼴로 재서, 실제로 그려지는
 * Pretendard 가 더 넓어 옆 항목과 겹친다.
 */
const FONT_FAMILY = "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif";

const AXIS_LABEL = { color: '#6b7280', fontSize: 12 };
const GRID_LINE = { lineStyle: { color: '#ecedf0' } };

export interface SeriesSpec {
  /** Redash 결과의 컬럼 이름. */
  column: string;
  /** 범례에 쓸 이름. 비우면 컬럼 이름이다. */
  label?: string;
}

export interface TimeSeriesSpec {
  rows: RedashRow[];
  /** x 축 컬럼. 날짜나 주 시작일 문자열이다. */
  x: string;
  series: SeriesSpec[];
  kind: 'bar' | 'line';
  /** 막대를 쌓는다. 더해서 의미가 있는 값(가입 수, 수집 공고 수)에만 쓴다. */
  stack?: boolean;
  /** y 축과 툴팁 값 뒤에 붙는 단위. */
  unit: string;
}

/** `2026-10-19` 를 `10/19` 로. 날짜가 아니면 그대로 둔다. */
function shortDate(value: string): string {
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(value);
  return match ? `${Number(match[1])}/${Number(match[2])}` : value;
}

function toNumber(value: RedashRow[string] | undefined): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** Redash 는 최근 기간을 위에 둔다. 차트는 시간 순으로 읽혀야 해서 오름차순으로 뒤집는다. */
export function sortByX(rows: RedashRow[], x: string): RedashRow[] {
  return [...rows].sort((a, b) => String(a[x]).localeCompare(String(b[x])));
}

export function timeSeriesOption({
  rows,
  x,
  series,
  kind,
  stack = false,
  unit,
}: TimeSeriesSpec): EChartsCoreOption {
  const sorted = sortByX(rows, x);
  const categories = sorted.map((row) => String(row[x]));
  // 점이 많으면 표식이 선을 덮는다. 기간이 짧을 때만 점을 찍는다.
  const showSymbol = categories.length <= 16;

  return {
    color: SERIES_COLORS,
    textStyle: { fontFamily: FONT_FAMILY },
    // 위에 범례, 그 아래에 y 축 단위가 온다. 둘이 겹치지 않게 간격을 둔다.
    grid: { top: 60, right: 16, bottom: 28, left: 48 },
    legend: {
      top: 0,
      left: 0,
      icon: kind === 'line' ? 'roundRect' : 'rect',
      itemWidth: 12,
      itemGap: 16,
      itemHeight: kind === 'line' ? 3 : 12,
      textStyle: { color: '#374151', fontSize: 12 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: kind === 'line' ? 'line' : 'shadow' },
      valueFormatter: (value: unknown) =>
        typeof value === 'number' ? `${value.toLocaleString('ko-KR')}${unit}` : '-',
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { ...AXIS_LABEL, formatter: shortDate },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameGap: 12,
      nameTextStyle: { ...AXIS_LABEL, align: 'right' },
      axisLabel: AXIS_LABEL,
      splitLine: GRID_LINE,
    },
    series: series.map(({ column, label }, index) => ({
      name: label ?? column,
      type: kind,
      data: sorted.map((row) => toNumber(row[column])),
      ...(kind === 'bar'
        ? {
            stack: stack ? 'total' : undefined,
            barMaxWidth: 28,
            // 이웃한 막대와 쌓인 칸 사이에 바탕색 틈을 둔다.
            itemStyle: {
              borderColor: '#ffffff',
              borderWidth: 1,
              // 쌓을 때는 맨 위 칸만 둥글린다.
              borderRadius: !stack || index === series.length - 1 ? [4, 4, 0, 0] : 0,
            },
          }
        : {
            lineStyle: { width: 2 },
            symbol: 'circle',
            symbolSize: 8,
            showSymbol,
            itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
            connectNulls: true,
          }),
    })),
  };
}

/**
 * 긴 형식(기간·계열·값이 한 줄씩)을 계열별 컬럼으로 편다. 채널별 추이가 이 모양으로 온다.
 *
 * 색이 여덟 개라 계열은 일곱까지 그리고 나머지는 하나로 합친다. 합계가 큰 순서로 고르므로, 기간을
 * 바꾸면 어느 채널이 따로 나오는지는 달라질 수 있다.
 */
export function pivotLong(
  rows: RedashRow[],
  {
    x,
    seriesColumn,
    value,
    otherLabel,
    maxSeries = 7,
  }: {
    x: string;
    seriesColumn: string;
    value: string;
    otherLabel: string;
    maxSeries?: number;
  },
): { rows: RedashRow[]; series: SeriesSpec[] } {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const name = String(row[seriesColumn]);
    totals.set(name, (totals.get(name) ?? 0) + (toNumber(row[value]) ?? 0));
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  const kept = ranked.length > maxSeries + 1 ? ranked.slice(0, maxSeries) : ranked;
  const keptSet = new Set(kept);
  const hasOther = kept.length < ranked.length;

  const byX = new Map<string, RedashRow>();
  for (const row of rows) {
    const key = String(row[x]);
    const target = byX.get(key) ?? { [x]: key };
    const name = String(row[seriesColumn]);
    const column = keptSet.has(name) ? name : otherLabel;
    target[column] = (toNumber(target[column] ?? null) ?? 0) + (toNumber(row[value]) ?? 0);
    byX.set(key, target);
  }

  return {
    rows: [...byX.values()],
    series: [...kept, ...(hasOther ? [otherLabel] : [])].map((column) => ({ column })),
  };
}
