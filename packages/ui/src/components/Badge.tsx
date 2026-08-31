import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

const TONE_CLASSES = {
  main: 'bg-blue-50 text-blue-600',
  success: 'bg-green-50 text-success',
  urgent: 'bg-orange-50 text-orange-600',
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
