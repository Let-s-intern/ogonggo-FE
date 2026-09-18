import { type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Checkbox } from './Checkbox';

export interface CheckAllItem<T extends string> {
  value: T;
  label: ReactNode;
  /** 줄 오른쪽 끝에 붙는 것. 약관의 "보기" 버튼 같은 것을 쓰는 쪽이 만들어 넘긴다. */
  trailing?: ReactNode;
}

export interface CheckAllGroupProps<T extends string> {
  /** 맨 위 "전체 동의" 줄의 글자. */
  allLabel: string;
  items: readonly CheckAllItem<T>[];
  /** 체크된 항목의 `value`. */
  checked: readonly T[];
  onCheckedChange: (checked: T[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 맨 위 "전체 동의" 와 그 아래 항목 체크박스 묶음(`회원가입 유저.png` 의 약관 동의).
 *
 * 전체 동의는 항목이 모두 체크됐을 때만 체크로 보이고, 누르면 모두 켜거나 모두 끈다. 필수·선택 구분과 가입
 * 버튼을 켤지는 쓰는 쪽이 `checked` 를 보고 정한다 — 이 묶음은 무엇이 필수인지 모른다.
 */
export function CheckAllGroup<T extends string>({
  allLabel,
  items,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: CheckAllGroupProps<T>) {
  const allChecked = items.length > 0 && items.every((item) => checked.includes(item.value));

  const toggle = (value: T, next: boolean) => {
    // 항목 순서대로 돌려준다. 누른 순서가 값에 섞이지 않게.
    onCheckedChange(
      items
        .map((item) => item.value)
        .filter((v) => (v === value ? next : checked.includes(v))),
    );
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <Checkbox
        checked={allChecked}
        onChange={(next) => onCheckedChange(next ? items.map((item) => item.value) : [])}
        label={allLabel}
        labelClassName="font-semibold"
        disabled={disabled}
        className="pb-3"
      />
      <div className="flex flex-col gap-3 border-t border-gray-200 pt-3">
        {items.map((item) => (
          <div key={item.value} className="flex items-center justify-between gap-3">
            <Checkbox
              checked={checked.includes(item.value)}
              onChange={(next) => toggle(item.value, next)}
              label={item.label}
              disabled={disabled}
            />
            {item.trailing}
          </div>
        ))}
      </div>
    </div>
  );
}
