import { forwardRef } from 'react';
import { Input, type InputProps, cn } from '@ogonggo/ui';

export interface CountedInputProps extends Omit<InputProps, 'value' | 'maxLength'> {
  value: string;
  /** 요청 타입의 `@maxLength`. 넘겨 칠 수 없고, 오른쪽 끝에 `지금/최대` 로 보인다. */
  maxLength: number;
}

/**
 * 글자 수가 보이는 한 줄 입력칸. 기업 공고 폼 둘의 기관명 · 제목 · 한 줄 소개처럼 길이 제한이 있는
 * 칸에 쓴다. `maxLength` 만 걸면 제한에 닿았을 때 아무 말 없이 입력이 멈춰, 왜 안 쳐지는지 알 수 없다.
 *
 * 숫자는 입력칸 안 오른쪽에 둔다. 칸 아래에 두면 `Field` 의 안내 한 줄과 겹치고, 줄 안에 늘어선
 * 행(커리큘럼·파트너사)에서는 둘 자리가 없다. 제한에 닿으면 빨갛게 바뀐다.
 */
export const CountedInput = forwardRef<HTMLInputElement, CountedInputProps>(
  ({ value, maxLength, className, ...props }, ref) => {
    const full = value.length >= maxLength;
    return (
      <div className="relative w-full min-w-0">
        <Input
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={cn('pr-20', className)}
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs tabular-nums',
            full ? 'font-medium text-error' : 'text-gray-400',
          )}
        >
          {value.length.toLocaleString()}/{maxLength.toLocaleString()}
        </span>
      </div>
    );
  },
);
CountedInput.displayName = 'CountedInput';
