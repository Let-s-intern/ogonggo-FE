import { cn } from '@ogonggo/ui';
import type { FilterGroup } from '../lib/filter';

export interface FilterChipGroupProps {
  group: FilterGroup;
  /** 고른 값. 하나만 든다. */
  selected: readonly string[];
  onSelect: (value: string) => void;
  /** `전체` 를 눌렀을 때. 선택을 비운다. */
  onClear: () => void;
  /** 이름을 화면에서 숨긴다. 탭이 이미 이름을 보이는 자리(필터 시트)에서 쓴다. */
  hideLabel?: boolean;
  /** 칩 격자의 열 수 클래스. 사이드바는 좁아 3열, 시트는 4열이다. */
  columnsClassName?: string;
}

/**
 * 값 하나를 고르는 칩 묶음(`FilterGroup.single`). 지역처럼 항목이 많고 API 가 하나만 받는 필터라
 * 체크박스를 늘어놓지 않고 칩 격자로 둔다 — 사이드바가 화면에 붙어 있어 세로로 길어지면 아래가 잘리고,
 * 선택 상자는 고르기 전에는 무엇이 있는지 보이지 않는다. 고른 칩을 다시 누르면 해제된다.
 * PC 사이드바와 모바일 시트가 같이 쓴다.
 */
export function FilterChipGroup({
  group,
  selected,
  onSelect,
  onClear,
  hideLabel = false,
  columnsClassName = 'grid-cols-3',
}: FilterChipGroupProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className={cn('mb-3 text-sm font-bold text-gray-900', hideLabel && 'sr-only')}>
        {group.label}
      </legend>
      <div className={cn('grid gap-1.5', columnsClassName)}>
        <Chip label="전체" active={selected.length === 0} onClick={onClear} />
        {group.options.map(([value, label]) => (
          <Chip
            key={value}
            label={label}
            active={selected.includes(value)}
            onClick={() => onSelect(value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

/** 켜짐은 다른 필터의 켜짐(`FilterButton` selected)처럼 파란 배경이다. 파란 테두리가 아니다. */
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-8 min-w-0 cursor-pointer rounded-full border px-1 text-sm transition-colors',
        active
          ? 'border-transparent bg-blue-50 font-semibold text-blue-500'
          : 'border-gray-200 bg-white font-normal text-gray-600 hover:border-gray-400 hover:text-gray-800',
      )}
    >
      {label}
    </button>
  );
}
