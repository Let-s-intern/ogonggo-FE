import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@ogonggo/ui';

/**
 * `apps/web/src/shared/ui/icons.tsx` 에서 기업 마이페이지가 쓰는 `ChevronIcon` 만 옮겼다.
 *
 * 아이콘은 Iconify 로 그린다(`packages/ui/src/styles/tokens.css` 의 `@plugin "@iconify/tailwind4"`).
 * 플러그인이 소스에 적힌 `icon-[lucide--chevron-down]` 꼴의 문자열을 스캔하므로 이름을 변수로 조립하지 않는다.
 */

export type IconProps = ComponentPropsWithoutRef<'span'>;

export type ChevronDirection = 'up' | 'down' | 'left' | 'right';

/**
 * 방향은 이름이 아니라 회전으로 낸다. `icon-[lucide--chevron-${direction}]` 처럼 조립하면
 * 플러그인 스캐너가 못 찾아서 아이콘이 통째로 사라진다.
 */
const CHEVRON_ROTATION: Record<ChevronDirection, string> = {
  down: 'rotate-0',
  up: 'rotate-180',
  left: 'rotate-90',
  right: '-rotate-90',
};

export interface ChevronIconProps extends IconProps {
  direction?: ChevronDirection;
}

export function ChevronIcon({ direction = 'down', className, ...props }: ChevronIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('icon-[lucide--chevron-down] block', CHEVRON_ROTATION[direction], className)}
      {...props}
    />
  );
}
