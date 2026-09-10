import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
}

/**
 * 네이티브 `select`. 목록 화면의 필터 드롭다운이다.
 *
 * 직접 만든 드롭다운을 쓰지 않는다. 키보드 조작, 모바일 네이티브 피커, 스크린 리더가 전부
 * 공짜로 따라오고, 운영 화면이 그 이상을 요구하지 않는다.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900',
        'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100',
        'disabled:bg-gray-50 disabled:text-gray-400',
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
);
Select.displayName = 'Select';
