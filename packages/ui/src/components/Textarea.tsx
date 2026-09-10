import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border border-gray-300 p-3 text-sm text-gray-900 placeholder:text-gray-400',
        'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100',
        'disabled:bg-gray-50 disabled:text-gray-400',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
