'use client';

import { cn } from '@ogonggo/ui';

export interface FormRadioOption {
  value: string;
  label: string;
}

export interface FormRadioGroupProps {
  name: string;
  options: readonly FormRadioOption[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * 테두리 상자 안에 동그라미와 글자가 든 라디오 줄. 기준은 `apps/web/src/shared/ui/FormRadioGroup.tsx` 다.
 *
 * 진짜 `input[type=radio]` 를 쓴다. 화살표 키 이동과 스크린 리더의 "n 개 중 m 번째" 를
 * 브라우저가 해 준다.
 */
export function FormRadioGroup({ name, options, value, onChange }: FormRadioGroupProps) {
  return (
    <div className="flex gap-3">
      {options.map((option) => {
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              'flex h-11 flex-1 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm',
              checked
                ? 'border-blue-500 font-medium text-gray-900'
                : 'border-gray-300 text-gray-500',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="size-4 accent-blue-500"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
