'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { AccountIcon, ChevronIcon } from '@/shared/ui/icons';

export interface AccountMenuProps {
  /** `{이름} 님` 의 이름. 계정을 아직 못 읽었거나 이름이 비어 있으면 `마이페이지` 로 적는다. */
  name?: string;
  myPageHref: string;
  myPageActive: boolean;
  /** 관리자일 때만 온다. 있으면 드롭다운이 되고, 없으면 마이페이지로 가는 링크 하나다. */
  adminOrigin?: string;
}

/**
 * 데스크톱 헤더 우측의 `[사람] {이름} 님`. 전에는 `마이페이지`·`어드민` 이 나란히 있었다.
 *
 * 일반·기업 회원에게는 갈 곳이 마이페이지 하나라 그대로 링크다. 관리자만 갈 곳이 둘이라
 * 누르면 `마이페이지`·`어드민` 이 펼쳐진다.
 *
 * `<details>` 가 아니라 상태로 여닫는다. 헤더는 화면을 옮겨도 남아 있어서, `<details>` 는
 * `마이페이지` 를 눌러 이동한 뒤에도 열린 채로 남는다. 바깥을 누르거나 Esc 를 눌러도 닫는다.
 */
export function AccountMenu({ name, myPageHref, myPageActive, adminOrigin }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
  }, [open]);

  const label = (
    <>
      <AccountIcon className="h-5 w-5 text-gray-900" />
      <span>{name ? `${name} 님` : '마이페이지'}</span>
    </>
  );
  const labelClass = cn('flex items-center gap-1.5 text-gray-900', myPageActive && 'font-semibold');

  if (!adminOrigin) {
    return (
      <Link
        href={myPageHref}
        aria-current={myPageActive ? 'page' : undefined}
        className={labelClass}
      >
        {label}
      </Link>
    );
  }

  const itemClass = 'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50';
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={labelClass}
      >
        {label}
        <ChevronIcon direction={open ? 'up' : 'down'} className="h-4 w-4 text-gray-500" />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 z-20 mt-2 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-md"
        >
          <li role="none">
            <Link
              role="menuitem"
              href={myPageHref}
              aria-current={myPageActive ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className={cn(itemClass, myPageActive && 'font-semibold text-gray-900')}
            >
              마이페이지
            </Link>
          </li>
          <li role="none">
            {/* 다른 도메인이라 `Link` 가 아니라 `a` 다. */}
            <a role="menuitem" href={adminOrigin} className={itemClass}>
              어드민
            </a>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
