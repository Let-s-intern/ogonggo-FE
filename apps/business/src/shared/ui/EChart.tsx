'use client';

import { useEffect, useRef } from 'react';
import { BarChart, FunnelChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  TooltipComponent,
} from 'echarts/components';
import { type EChartsCoreOption, init, use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

// 쓰는 것만 등록한다. `echarts` 전체를 불러오면 번들이 1MB 가까이 는다.
use([
  BarChart,
  FunnelChart,
  LineChart,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  TooltipComponent,
  SVGRenderer,
]);

export interface EChartProps {
  option: EChartsCoreOption;
  /** 픽셀. 폭은 부모를 따라간다. */
  height?: number;
  className?: string;
}

/**
 * ECharts 를 React 에 붙이는 얇은 틀. 옵션이 바뀌면 다시 그리고, 부모 폭이 바뀌면 크기를 맞춘다. 어드민
 * (`apps/admin/src/shared/ui/EChart.tsx`)과 같고, 리포트의 "집계 전" 칸을 칠하려고 `MarkAreaComponent` 를, 스크롤 깊이 깔때기를 그리려고
 * `FunnelChart` 를 더했다.
 * SVG 로 그려 PDF 로 뜰 때(`html-to-image`) 그대로 나온다.
 */
export function EChart({ option, height = 280, className }: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof init> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const chart = init(container, undefined, { renderer: 'svg' });
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    // 기간을 바꾸면 날짜 수가 달라진다. 합치지 않고 통째로 바꿔야 지난 값이 남지 않는다.
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div ref={containerRef} className={className} style={{ height }} />;
}
