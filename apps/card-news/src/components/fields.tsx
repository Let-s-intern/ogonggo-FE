'use client';

import { useId } from 'react';

/** 색 고르기 + 헥스 직접 입력. */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm text-gray-700">
        {label}
      </label>
      <span className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="size-8 cursor-pointer rounded border border-gray-200 bg-transparent"
        />
        <input
          aria-label={`${label} 값`}
          defaultValue={value}
          key={value}
          onChange={(event) => {
            const next = event.target.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(next)) {
              onChange(next.toUpperCase());
            }
          }}
          className="h-8 w-24 rounded border border-gray-200 px-2 font-mono text-xs"
        />
      </span>
    </div>
  );
}

/** 몇 개 중 하나를 고르는 버튼 줄. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md px-1 py-1.5 text-sm font-semibold ${
            value === option.value ? 'bg-white shadow-sm' : 'text-gray-500'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
