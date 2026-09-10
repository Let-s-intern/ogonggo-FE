import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

const TONE_CLASSES = {
  info: 'border-blue-200 bg-blue-00 text-blue-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-orange-200 bg-orange-50 text-orange-800',
  error: 'border-red-200 bg-red-50 text-red-800',
} as const;

export interface CalloutProps extends HTMLAttributes<HTMLDivElement> {
  tone?: keyof typeof TONE_CLASSES;
}

/**
 * 화면 안에 남는 상태 문구. 저장 결과, 경고, 안내가 여기 들어간다.
 *
 * 사라지는 토스트가 아니다. 운영자가 화면을 보고 있지 않은 사이에 떴다 사라지면 무슨 일이
 * 있었는지 알 방법이 없고, 되돌릴 수도 없다. 자리를 차지하더라도 남아 있는 편이 낫다.
 *
 * `role="status"` 라 스크린 리더가 내용이 바뀔 때 읽는다. 초점을 빼앗지는 않는다.
 */
export const Callout = forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, tone = 'info', ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn('rounded-md border px-4 py-3 text-sm', TONE_CLASSES[tone], className)}
      {...props}
    />
  ),
);
Callout.displayName = 'Callout';
