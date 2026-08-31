import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-11 w-full rounded-m border border-gray-300 px-4 text-base text-gray-900 placeholder:text-gray-400',
      'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100',
      'disabled:bg-gray-50 disabled:text-gray-400',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
