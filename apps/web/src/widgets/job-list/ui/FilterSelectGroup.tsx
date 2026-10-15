import { cn, Select } from '@ogonggo/ui';
import type { FilterGroup } from '../lib/filter';

export interface FilterSelectGroupProps {
  group: FilterGroup;
  /** 고른 값. 하나만 든다. */
  selected: readonly string[];
  onSelect: (value: string) => void;
  /** `전체` 를 골랐을 때. 선택을 비운다. */
  onClear: () => void;
  /** 이름을 화면에서 숨긴다. 탭이 이미 이름을 보이는 자리(필터 시트)에서 쓴다. */
  hideLabel?: boolean;
}

/**
 * 값 하나를 고르는 묶음(`FilterGroup.single`). 지역처럼 항목이 많고 API 가 하나만 받는 필터라 체크박스를
 * 열 개 넘게 늘어놓지 않고 선택 상자 하나로 둔다 — 사이드바가 화면에 붙어 있어 길어지면 아래가 잘린다.
 * 모바일은 네이티브 선택기가 뜬다. PC 사이드바와 모바일 시트가 같이 쓴다.
 */
export function FilterSelectGroup({
  group,
  selected,
  onSelect,
  onClear,
  hideLabel = false,
}: FilterSelectGroupProps) {
  const id = `job-filter-${group.filterType}`;
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <label
        htmlFor={id}
        className={cn('mb-0 text-sm font-bold text-gray-900', hideLabel && 'sr-only')}
      >
        {group.label}
      </label>
      <Select
        id={id}
        // 고른 값이 있으면 다른 필터의 켜짐(`FilterButton` selected)처럼 파랗게 보인다.
        className={cn(
          'w-full',
          selected.length > 0 && 'border-transparent bg-blue-50 font-semibold text-blue-500',
        )}
        value={selected[0] ?? ''}
        options={[
          { value: '', label: '전체' },
          ...group.options.map(([value, label]) => ({ value, label })),
        ]}
        onChange={(event) => {
          const value = event.target.value;
          if (value === '') {
            onClear();
          } else {
            onSelect(value);
          }
        }}
      />
    </div>
  );
}
