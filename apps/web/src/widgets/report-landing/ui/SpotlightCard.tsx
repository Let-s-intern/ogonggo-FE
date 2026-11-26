'use client';

import Link from 'next/link';
import type { PointerEvent, ReactNode } from 'react';
import { cn } from '@ogonggo/ui';

/**
 * 마우스를 따라다니는 스포트라이트가 있는 카드 링크. 이 파일이 이 화면의 유일한 클라이언트 컴포넌트다.
 *
 * 위치는 상태가 아니라 CSS 변수 `--x`/`--y` 로 카드 요소에 직접 쓴다. 마우스가 움직일 때마다 리액트를 다시
 * 그리지 않는다. 변수를 읽는 글로우 두 겹(안쪽 은은한 빛, 테두리 빛)은 호버와 키보드 포커스에서만 보이고,
 * 변수의 기본값(위쪽 가운데)이 포커스 때의 위치가 된다. 터치는 호버가 없으므로 따라다니지 않는다.
 *
 * 카드 내용은 서버에서 그려 `children` 으로 받는다.
 */
export function SpotlightCard({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const follow = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== 'mouse') return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--y', `${event.clientY - rect.top}px`);
  };

  return (
    <Link
      href={href}
      onPointerMove={follow}
      className={cn(
        'group relative isolate flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm md:p-8',
        'transition-[transform,background-color,border-color] duration-300',
        'hover:bg-white/[0.07] motion-safe:hover:-translate-y-1 motion-reduce:transition-none',
        'focus-visible:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300',
          'bg-[radial-gradient(480px_circle_at_var(--x,50%)_var(--y,0%),rgb(74_118_255/0.22),transparent_70%)]',
          'group-hover:opacity-100 group-focus-visible:opacity-100',
        )}
      />
      <span
        aria-hidden="true"
        className="report-landing-ring pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      {children}
    </Link>
  );
}
