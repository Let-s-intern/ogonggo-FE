import { useId, useMemo, useState } from 'react';
import type { AdminDailyViewCount } from '@ogonggo/api/src/mocks/fixtures/admin-dashboard';

export interface ViewCountTrendProps {
  /** 오래된 날짜가 먼저 오는 7칸. */
  points: AdminDailyViewCount[];
}

/**
 * 최근 7일 조회 수 추이.
 *
 * 시리즈가 하나뿐이라 범례를 두지 않는다 — 무엇을 그린 것인지는 제목이 말한다. 색은 파랑
 * 한 가지이고 축·격자는 회색으로 물러나 있다.
 *
 * 라이브러리를 쓰지 않고 SVG 를 직접 그린다. 점 일곱 개짜리 선 하나에 차트 라이브러리를
 * 더하면 번들이 화면보다 커진다. 축이 여러 개거나 종류가 늘면 그때 다시 본다.
 *
 * 툴팁이 값을 가두지 않는다. 마지막 점에는 값을 직접 붙이고, 나머지 값은 아래 표에 그대로
 * 있다. 마우스 없이도 모든 숫자에 닿을 수 있어야 한다.
 */
export function ViewCountTrend({ points }: ViewCountTrendProps) {
  const gradientId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const geometry = useMemo(() => buildGeometry(points), [points]);

  if (geometry === null) {
    return <p className="text-sm text-gray-500">표시할 데이터가 없습니다.</p>;
  }

  const { linePath, areaPath, coordinates, ticks, maxValue } = geometry;
  const active = activeIndex === null ? null : points[activeIndex];
  const activeCoordinate = activeIndex === null ? null : coordinates[activeIndex];

  // 호버 중에는 툴팁이 같은 자리에 뜨므로 끝 라벨을 숨긴다. 둘이 겹쳐 읽히지 않는다.
  const lastCoordinate = coordinates[coordinates.length - 1];
  const lastPoint = points[points.length - 1];
  const endLabel =
    activeIndex === null && lastCoordinate && lastPoint
      ? { x: lastCoordinate.x, y: lastCoordinate.y, value: lastPoint.viewCount }
      : null;

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`최근 ${points.length}일 조회 수 추이. 최고 ${maxValue.toLocaleString('ko-KR')}회.`}
          onPointerLeave={() => setActiveIndex(null)}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const ratio = (event.clientX - bounds.left) / bounds.width;
            setActiveIndex(nearestIndex(ratio * WIDTH, coordinates));
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-blue-500)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--color-blue-500)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={tick.y}
                y2={tick.y}
                stroke="var(--color-gray-200)"
                strokeWidth="1"
              />
              <text
                x={PADDING.left - 8}
                y={tick.y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-gray-400 text-[11px] [font-variant-numeric:tabular-nums]"
              >
                {tick.value.toLocaleString('ko-KR')}
              </text>
            </g>
          ))}

          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-blue-500)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {activeCoordinate ? (
            <line
              x1={activeCoordinate.x}
              x2={activeCoordinate.x}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              stroke="var(--color-gray-300)"
              strokeWidth="1"
            />
          ) : null}

          {coordinates.map((coordinate, index) => {
            const isActive = index === activeIndex;
            const isLast = index === coordinates.length - 1;
            if (!isActive && !isLast) {
              return null;
            }
            return (
              <circle
                key={points[index]?.date}
                cx={coordinate.x}
                cy={coordinate.y}
                r="4"
                fill="var(--color-blue-500)"
                stroke="var(--color-gray-00)"
                strokeWidth="2"
              />
            );
          })}

          {coordinates.map((coordinate, index) => (
            <text
              key={points[index]?.date}
              x={coordinate.x}
              y={HEIGHT - PADDING.bottom + 16}
              textAnchor="middle"
              className="fill-gray-400 text-[11px]"
            >
              {formatDayLabel(points[index]?.date)}
            </text>
          ))}

          {/*
            마지막 값만 직접 붙인다. 점마다 숫자를 달면 읽히지 않고, 나머지 값은 축 눈금과
            아래 표가 이미 들고 있다. 오른쪽 끝이라 `textAnchor` 를 end 로 두어야 넘치지 않는다.
          */}
          {endLabel ? (
            <text
              x={endLabel.x}
              y={endLabel.y - 12}
              textAnchor="end"
              className="fill-gray-900 text-[12px] font-semibold [font-variant-numeric:tabular-nums]"
            >
              {endLabel.value.toLocaleString('ko-KR')}
            </text>
          ) : null}
        </svg>

        {active && activeCoordinate ? (
          <div
            className="pointer-events-none absolute -mt-2 -translate-x-1/2 -translate-y-full rounded-sm border border-gray-200 bg-white px-2 py-1 shadow-sm"
            style={{
              left: `${(activeCoordinate.x / WIDTH) * 100}%`,
              top: `${(activeCoordinate.y / HEIGHT) * 100}%`,
            }}
          >
            <p className="text-sm font-semibold text-gray-900">
              {active.viewCount.toLocaleString('ko-KR')}회
            </p>
            <p className="text-[11px] text-gray-500">{active.date}</p>
          </div>
        ) : null}
      </div>

      <details className="pt-4">
        <summary className="cursor-pointer text-sm text-gray-500">표로 보기</summary>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-1 font-medium">날짜</th>
              <th className="py-1 text-right font-medium">조회 수</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.date} className="border-b border-gray-100">
                <td className="py-1 text-gray-700">{point.date}</td>
                <td className="py-1 text-right text-gray-900 [font-variant-numeric:tabular-nums]">
                  {point.viewCount.toLocaleString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 12, right: 12, bottom: 28, left: 48 };

interface Coordinate {
  x: number;
  y: number;
}

interface Geometry {
  linePath: string;
  areaPath: string;
  coordinates: Coordinate[];
  ticks: { value: number; y: number }[];
  maxValue: number;
}

/**
 * 점 좌표와 눈금을 미리 계산한다.
 *
 * y 축은 0 에서 시작한다. 최솟값에서 시작하면 3% 오르내린 것이 절벽처럼 보인다.
 */
function buildGeometry(points: AdminDailyViewCount[]): Geometry | null {
  if (points.length === 0) {
    return null;
  }

  const maxValue = Math.max(...points.map((point) => point.viewCount));
  const axisMax = niceCeiling(maxValue);
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const coordinates = points.map((point, index) => ({
    // 점이 하나면 0 으로 나누게 되므로 가운데에 둔다.
    x:
      points.length === 1
        ? PADDING.left + plotWidth / 2
        : PADDING.left + (plotWidth * index) / (points.length - 1),
    y: PADDING.top + plotHeight * (1 - point.viewCount / axisMax),
  }));

  const linePath = coordinates
    .map((coordinate, index) => `${index === 0 ? 'M' : 'L'}${coordinate.x} ${coordinate.y}`)
    .join(' ');

  const baseline = HEIGHT - PADDING.bottom;
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const areaPath =
    first && last ? `${linePath} L${last.x} ${baseline} L${first.x} ${baseline} Z` : linePath;

  const TICK_COUNT = 4;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, index) => {
    const value = (axisMax * index) / TICK_COUNT;
    return { value, y: PADDING.top + plotHeight * (1 - index / TICK_COUNT) };
  });

  return { linePath, areaPath, coordinates, ticks, maxValue };
}

/** 축 최댓값을 1·2·5 × 10^n 으로 올려 눈금이 깔끔한 수가 되게 한다. */
function niceCeiling(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** 포인터의 x 에 가장 가까운 점. 선 위를 정확히 짚지 않아도 값이 뜬다. */
function nearestIndex(x: number, coordinates: Coordinate[]): number | null {
  let nearest: number | null = null;
  let shortest = Number.POSITIVE_INFINITY;
  coordinates.forEach((coordinate, index) => {
    const distance = Math.abs(coordinate.x - x);
    if (distance < shortest) {
      shortest = distance;
      nearest = index;
    }
  });
  return nearest;
}

/** `2026-09-10` -> `9/10`. 일곱 칸이 가로로 붙어 있어 연도까지 쓰면 겹친다. */
function formatDayLabel(date: string | undefined): string {
  if (date === undefined) {
    return '';
  }
  const [, month, day] = date.split('-');
  return month && day ? `${Number(month)}/${Number(day)}` : date;
}
