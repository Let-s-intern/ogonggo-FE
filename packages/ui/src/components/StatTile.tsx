import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

export interface StatTileProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 문장형 소문자. 끝에 콜론을 붙이지 않는다. */
  label: string;
  value: number;
  /** `건`, `명` 처럼 값 뒤에 붙는 단위. 숫자보다 작고 흐리게 나간다. */
  unit?: string;
}

/**
 * 숫자 하나를 크게 보여주는 타일. 대시보드의 KPI 줄을 이룬다.
 *
 * 링크로 만들지 않는다. 이 패키지는 Next 와 Vite 두 런타임에서 함께 쓰여 라우터를 가정할 수
 * 없다(`packages/ui` 의 Next 전용 API 금지 규칙). 누를 수 있는 타일이 필요하면 쓰는 쪽에서
 * 자기 라우터의 링크로 감싼다.
 *
 * 값은 `tabular-nums` 를 쓰지 않는다. 표의 세로줄을 맞출 때 필요한 설정이라, 큰 숫자 하나를
 * 보여줄 때 쓰면 자간이 벌어져 보인다.
 */
export const StatTile = forwardRef<HTMLDivElement, StatTileProps>(
  ({ className, label, value, unit, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}
      {...props}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="pt-2 text-3xl font-semibold text-gray-900">
        {value.toLocaleString('ko-KR')}
        {unit ? <span className="pl-1 text-lg font-medium text-gray-500">{unit}</span> : null}
      </p>
    </div>
  ),
);
StatTile.displayName = 'StatTile';
