import { useEffect, useRef } from 'react';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { type EChartsCoreOption, init, use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

// 쓰는 것만 등록한다. `echarts` 전체를 불러오면 번들이 1MB 가까이 는다.
use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, SVGRenderer]);

export interface EChartProps {
  option: EChartsCoreOption;
  /** 픽셀. 폭은 부모를 따라간다. */
  height?: number;
  className?: string;
}

/**
 * ECharts 를 React 에 붙이는 얇은 틀. 옵션이 바뀌면 다시 그리고, 부모 폭이 바뀌면 크기를 맞춘다.
 *
 * 이 앱에 차트가 통계 화면뿐이라 래퍼 라이브러리를 들이지 않았다.
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
    // 필터를 바꾸면 계열 수가 달라질 수 있다. 합치지 않고 통째로 바꿔야 사라진 계열이 남지 않는다.
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div ref={containerRef} className={className} style={{ height }} />;
}
