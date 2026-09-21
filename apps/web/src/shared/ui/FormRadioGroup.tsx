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
 * 테두리 상자 안에 동그라미와 글자가 든 라디오 줄(목업 `채용공고 등록.png` ·
 * `교육 부트캠프 공고 등록.png` 의 지원 방법).
 *
 * `@ogonggo/ui` 에 라디오가 없다. 기업 공고 폼 둘이 쓰고 그 밖에는 쓰는 곳이 없어 여기 둔다 —
 * 세 번째 화면이 같은 모양을 쓰게 되면 그때 `@ogonggo/ui` 로 옮긴다(`core.md` 단순함 우선).
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
