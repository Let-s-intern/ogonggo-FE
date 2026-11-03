import type { AdReportDaily } from '@ogonggo/api/src/mocks/fixtures/advertisement-types';
import { formatShortDate } from '@/entities/advertisement';

export interface TrendChartProps {
  daily: AdReportDaily[];
  /** 공고 마감일. 범위 안이면 세로 점선을 긋는다. */
  postDeadline?: string;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 32, left: 16 };

/**
 * 일별 추이(시안 B-06 `trendChart`). 차트 라이브러리를 들이지 않고 SVG 꺾은선 둘로 그린다(Push 7 결정 필요). 노출과 클릭은
 * 크기가 달라 각자 자기 최댓값에 맞춰 같은 높이를 쓴다 — 모양(언제 늘고 줄었는지)을 보는 그림이고, 수치는 아래 표가 준다.
 */
export function TrendChart({ daily, postDeadline }: TrendChartProps) {
  if (daily.length === 0) return null;
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) =>
    PAD.left + (daily.length === 1 ? innerWidth / 2 : (innerWidth * index) / (daily.length - 1));
  const line = (values: number[]) => {
    const max = Math.max(...values, 1);
    return values
      .map((value, index) => `${x(index)},${PAD.top + innerHeight * (1 - value / max)}`)
      .join(' ');
  };
  const deadlineIndex = postDeadline ? daily.findIndex((day) => day.date === postDeadline) : -1;

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-blue-500" />
          노출
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-orange-400" />
          클릭
        </span>
        {deadlineIndex >= 0 ? (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-0 border-l border-dashed border-gray-400" />
            공고 마감
          </span>
        ) : null}
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`일별 노출·클릭 추이, ${formatShortDate(daily[0]!.date)}부터 ${formatShortDate(daily[daily.length - 1]!.date)}까지`}
        className="h-auto w-full"
      >
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={PAD.top + innerHeight * ratio}
            y2={PAD.top + innerHeight * ratio}
            className="stroke-gray-100"
            strokeWidth={1}
          />
        ))}
        {deadlineIndex >= 0 ? (
          <line
            x1={x(deadlineIndex)}
            x2={x(deadlineIndex)}
            y1={PAD.top}
            y2={PAD.top + innerHeight}
            className="stroke-gray-400"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ) : null}
        <polyline
          points={line(daily.map((day) => day.impressions))}
          fill="none"
          className="stroke-blue-500"
          strokeWidth={2.5}
        />
        <polyline
          points={line(daily.map((day) => day.clicks))}
          fill="none"
          className="stroke-orange-400"
          strokeWidth={2.5}
        />
        {daily.map((day, index) => (
          <text
            key={day.date}
            x={x(index)}
            y={HEIGHT - 10}
            textAnchor="middle"
            className="fill-gray-400 text-[11px]"
          >
            {formatShortDate(day.date).slice(0, 5)}
          </text>
        ))}
      </svg>
    </figure>
  );
}
