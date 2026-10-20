import { cn } from '@ogonggo/ui';

interface MetricTileProps {
  label: string;
  value: number | null;
  unit: string;
  /** 비교 대상 값. 넘기면 차이를 값 아래에 적는다. */
  previous?: number | null;
  /** 비교 대상의 이름. `전일`, `전주` 같은 말. */
  previousLabel?: string;
  /** 무엇 기준의 숫자인지. */
  caption?: string;
}

/**
 * 숫자 하나와 직전 기간 대비 차이. `@ogonggo/ui` 의 `StatTile` 은 정수 하나만 받아, 소수 비율과 비교를
 * 함께 보여야 하는 통계 화면에서 따로 둔다.
 *
 * 차이는 색만으로 말하지 않는다. `+`·`-` 부호와 단위를 글자로 함께 적는다. 비율 지표의 차이는 %p 다.
 */
export function MetricTile({
  label,
  value,
  unit,
  previous,
  previousLabel,
  caption,
}: MetricTileProps) {
  const delta = value !== null && previous != null ? value - previous : null;
  const deltaUnit = unit === '%' ? '%p' : unit;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="pt-2 text-3xl font-semibold text-gray-900">
        {value === null ? '-' : value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
        <span className="pl-1 text-base font-medium text-gray-500">{unit}</span>
      </p>
      <p className="pt-1 text-xs text-gray-500">
        {delta !== null ? (
          <span
            className={cn(
              'font-medium',
              delta > 0 ? 'text-blue-600' : delta < 0 ? 'text-gray-700' : 'text-gray-500',
            )}
          >
            {previousLabel} 대비 {delta > 0 ? '+' : ''}
            {delta.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
            {deltaUnit}
          </span>
        ) : null}
        {delta !== null && caption ? ' · ' : null}
        {caption}
      </p>
    </div>
  );
}
