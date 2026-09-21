import Link from 'next/link';
import { cn, FilterButton } from '@ogonggo/ui';

export interface MyPageFilterDropdownProps<TValue extends string> {
  /** 아무것도 안 골랐을 때 트리거에 보이는 말. 목록 맨 위 "해제" 줄도 이 말을 쓴다. */
  label: string;
  selected?: TValue;
  options: readonly (readonly [TValue, string])[];
  buildHref: (value: TValue | undefined) => string;
  /** 드롭다운 폭. 직군·직무처럼 글자가 긴 목록이 있어 호출부가 정한다. */
  className?: string;
}

/**
 * 마이페이지 필터 줄의 드롭다운 하나. 트리거는 `FilterButton`(`docs/asset/v3-1/filter/`) 이고
 * 여닫는 `<details>` 껍데기와 목록은 여기 있다 — 그 컴포넌트가 트리거만 맡는 이유는 그쪽
 * 주석에 있다.
 *
 * `widgets/job-list/ui/SearchFilterBar.tsx` 안에 같은 모양의 `FilterDropdown` 이 있다. 그쪽은
 * 파일 안에 숨은 함수라 가져다 쓸 수 없는데, 그 파일을 고치는 것은 이 Push 의 범위가 아니라
 * 건드리지 않았다. 둘 중 하나를 지울 일이 생기면 이쪽이 내보내고 있으니 그쪽을 지운다.
 *
 * 옵션은 `<Link>` 다. 고르는 순간 주소가 바뀌고, 목록은 주소를 보고 다시 읽는다 — 필터 상태를
 * 리액트 상태로 따로 들면 뒤로가기가 어긋난다.
 */
export function MyPageFilterDropdown<TValue extends string>({
  label,
  selected,
  options,
  buildHref,
  className,
}: MyPageFilterDropdownProps<TValue>) {
  const currentLabel = options.find(([value]) => value === selected)?.[1] ?? label;

  return (
    <details className="group relative">
      <FilterButton
        state={selected ? 'selected' : 'default'}
        className="bg-white group-open:[&>span]:rotate-180"
      >
        {currentLabel}
      </FilterButton>
      <ul
        className={cn(
          'absolute left-0 z-10 mt-1 max-h-72 w-40 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-md',
          className,
        )}
      >
        <li>
          <Link
            href={buildHref(undefined)}
            className={cn(
              'block px-3 py-1.5 text-sm',
              selected ? 'text-gray-600 hover:bg-gray-50' : 'font-semibold text-blue-600',
            )}
          >
            {label}
          </Link>
        </li>
        {options.map(([value, optionLabel]) => (
          <li key={value}>
            <Link
              href={buildHref(value)}
              className={cn(
                'block px-3 py-1.5 text-sm',
                value === selected
                  ? 'font-semibold text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {optionLabel}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
