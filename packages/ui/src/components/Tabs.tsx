import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /** 글자 앞에 붙는 아이콘. 색은 `currentColor` 로 그리면 탭 글자색을 따른다. */
  icon?: ReactNode;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** 탭 묶음이 무엇을 가르는지. 스크린 리더가 읽는다. */
  'aria-label': string;
  className?: string;
}

/**
 * 가로로 나란한 탭. 칸이 폭을 똑같이 나누고, 고른 탭에 파란 밑줄이 붙는다(`로그인.png` 의 일반·기업 회원).
 *
 * 탭 아래 내용은 쓰는 쪽이 `value` 로 골라 그린다. 이 컴포넌트는 고른 값을 알리기만 한다 — 주소(`?tab=`)
 * 에 담을지 상태에 둘지는 화면이 정한다.
 *
 * 밑줄은 버튼마다 2px 로 그리고, 고르지 않은 칸은 같은 자리에 1px 회색 선을 둔다. 전체에 선 하나를 깔고
 * 그 위에 파란 선을 겹치면 음수 여백이 필요해 높이 계산이 어긋난다.
 */
export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  'aria-label': ariaLabel,
  className,
}: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex w-full', className)}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onValueChange(item.value)}
            className={cn(
              'flex h-16 flex-1 items-center justify-center gap-1.5 text-base transition-colors',
              selected
                ? 'border-b-2 border-blue-500 font-semibold text-blue-500'
                : 'border-b border-gray-200 pt-px font-medium text-gray-400 hover:text-gray-600',
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
