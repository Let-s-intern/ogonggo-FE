'use client';

/*
 * 훅을 쓰므로 클라이언트 경계다. 이유는 `Toggle.tsx` 머리 주석과 같다.
 */
import { type ReactNode, useId } from 'react';
import { cn } from '../lib/cn';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 네모 오른쪽 글자. 일부만 색을 달리하려면 요소로 넘긴다. */
  label: ReactNode;
  disabled?: boolean;
  className?: string;
  /** 글자 굵기 등 라벨에만 줄 클래스. */
  labelClassName?: string;
}

/**
 * 네모 체크박스와 오른쪽 글자(`회원가입 유저.png` 의 약관 동의).
 *
 * `Toggle` 처럼 진짜 `input[type=checkbox]` 를 네모 위에 겹쳐 깐다 — Tab 초점, Space 토글, 스크린 리더의
 * 상태 읽기를 브라우저가 해 준다. 그림은 `peer` 로 input 상태를 따른다.
 *
 * 꺼진 상태에도 옅은 체크 표시를 그린다. 디자인이 빈 네모가 아니라 회색 체크로 그렸다.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className,
  labelClassName,
}: CheckboxProps) {
  const id = useId();

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex size-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 rounded-[3px] border border-gray-300 bg-white text-gray-300 transition-colors',
            'peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-blue-100',
            'peer-disabled:bg-gray-50',
          )}
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-full">
            <path
              d="M5.5 10.2 8.6 13.2 14.5 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      <label
        htmlFor={id}
        className={cn(
          'cursor-pointer text-sm text-gray-900',
          disabled && 'cursor-not-allowed text-gray-400',
          labelClassName,
        )}
      >
        {label}
      </label>
    </span>
  );
}
