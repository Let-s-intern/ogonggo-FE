'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { MenuItem, cn } from '@ogonggo/ui';
import { ChevronIcon } from '@/shared/ui/icons';

const ITEMS = [
  { label: '공지사항', href: '/notices' },
  { label: '오공고 커뮤니티', href: '/community' },
] as const;

export interface CommunityMenuProps {
  pathname: string;
  /** 열림 상태는 `SiteHeader` 가 든다. 알림 패널·`{이름} 님` 메뉴와 한 번에 하나만 열린다. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 데스크톱 헤더 메뉴 줄의 `커뮤니티` 탭. 누르면 아래로 `공지사항`·`오공고 커뮤니티` 가 펼쳐진다(이슈 #680). 전에는 두
 * 링크가 맨 위 띠에 따로 있었다. 옆 탭과 같은 `MenuItem` 이라 둘 중 한 화면에 있으면 밑줄이 붙는다.
 *
 * `AccountMenu` 와 같은 방식으로 여닫는다 — 바깥을 누르거나 Esc 를 누르면 닫고, 항목을 누르면 닫힌다.
 */
export function CommunityMenu({ pathname, open, onOpenChange: setOpen }: CommunityMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = ITEMS.some((item) => isActive(pathname, item.href));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-current={active ? 'page' : undefined}
        onClick={() => setOpen(!open)}
      >
        <MenuItem
          state={active ? 'current' : 'default'}
          className={cn('gap-0.5 text-sm', active && 'font-semibold')}
        >
          커뮤니티
          <ChevronIcon direction={open ? 'up' : 'down'} className="h-4 w-4" />
        </MenuItem>
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute left-0 z-20 mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-md"
        >
          {ITEMS.map((item) => {
            const current = isActive(pathname, item.href);
            return (
              <li key={item.href} role="none">
                <Link
                  role="menuitem"
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50',
                    current && 'font-semibold text-gray-900',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
