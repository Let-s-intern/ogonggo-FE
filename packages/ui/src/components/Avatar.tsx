import * as RadixAvatar from '@radix-ui/react-avatar';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '../lib/cn';

export interface AvatarProps extends ComponentPropsWithoutRef<typeof RadixAvatar.Root> {
  src?: string;
  alt?: string;
  fallback: string;
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => (
    <RadixAvatar.Root
      ref={ref}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-500 text-sm font-semibold text-white',
        className,
      )}
      {...props}
    >
      {src ? (
        <RadixAvatar.Image src={src} alt={alt} className="h-full w-full object-cover" />
      ) : null}
      <RadixAvatar.Fallback delayMs={src ? 400 : undefined}>{fallback}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  ),
);
Avatar.displayName = 'Avatar';
