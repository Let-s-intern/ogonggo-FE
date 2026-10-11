import { Checkbox, cn } from '@ogonggo/ui';
import type { FilterGroup } from '../lib/filter';

export interface FilterCheckGroupProps {
  group: FilterGroup;
  selected: readonly string[];
  onToggle: (value: string) => void;
  /** `전체` 를 눌렀을 때. 그 묶음의 선택을 비운다. */
  onClear: () => void;
  /** 이름을 화면에서 숨긴다. 탭이 이미 이름을 보이는 자리(필터 시트)에서 쓴다. */
  hideLabel?: boolean;
}

/**
 * 체크박스 묶음 하나. `전체` 는 고른 것이 없다는 뜻이라 아무것도 안 골랐을 때만 켜지고, 누르면 이
 * 묶음의 선택을 비운다. PC 사이드바와 모바일 시트가 같이 쓴다.
 */
export function FilterCheckGroup({
  group,
  selected,
  onToggle,
  onClear,
  hideLabel = false,
}: FilterCheckGroupProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className={cn('mb-3 text-sm font-bold text-gray-900', hideLabel && 'sr-only')}>
        {group.label}
      </legend>
      <Checkbox label="전체" checked={selected.length === 0} onChange={onClear} />
      {group.options.map(([value, label]) => (
        <Checkbox
          key={value}
          label={label}
          checked={selected.includes(value)}
          onChange={() => onToggle(value)}
        />
      ))}
    </fieldset>
  );
}
