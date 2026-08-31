import { Slot } from '@radix-ui/react-slot';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

const VARIANT_CLASSES = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-200',
  secondary: 'border border-gray-300 text-gray-900 hover:bg-gray-50 disabled:text-gray-400',
  ghost: 'text-gray-700 hover:bg-gray-100 disabled:text-gray-300',
} as const;

const SIZE_CLASSES = {
  md: 'h-11 px-4 text-base',
  sm: 'h-9 px-3 text-sm',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-m font-semibold transition-colors disabled:cursor-not-allowed',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
