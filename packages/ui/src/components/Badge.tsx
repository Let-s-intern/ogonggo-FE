import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

const TONE_CLASSES = {
  /* 글자는 `blue-500`(#4A76FF) 이다. 목업(`docs/image-3.png`) 과 맞춘 값으로, 배경은 원래 맞았다. */
  main: 'bg-blue-50 text-blue-500',
  success: 'bg-green-50 text-success',
  urgent: 'bg-orange-50 text-orange-600',
  /* 제재·숨김처럼 되돌려야 할 상태. urgent(주황)와 달리 "잘못됨"을 뜻한다. */
  danger: 'bg-red-50 text-red-600',
  neutral: 'bg-gray-100 text-gray-600',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof TONE_CLASSES;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = 'neutral', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-1 text-sm font-medium',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';
