'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { useSignOut } from '@/shared/api/useSignOut';

export interface AccountMenuProps {
  /** 기업 정보의 기관명. 계정을 아직 못 읽었거나 기업 정보가 없으면 `마이페이지` 로 적는다. */
  companyName?: string;
  myPageHref: string;
  myPageActive: boolean;
}

/**
 * 데스크톱 헤더 오른쪽의 `{기업명}`. 누르면 `마이페이지`·`로그아웃` 이 펼쳐진다. 기준은 web 의
 * `apps/web/src/widgets/site-header/ui/AccountMenu.tsx` 다.
 *
 * `<details>` 가 아니라 상태로 여닫는다. 헤더는 화면을 옮겨도 남아 있어서 `<details>` 는 `마이페이지` 로 이동한 뒤에도
 * 열린 채로 남는다. 바깥을 누르거나 Esc 를 눌러도 닫는다. 로그아웃하면 `useSignOut` 이 `/` 로 보낸다.
 */
export function AccountMenu({ companyName, myPageHref, myPageActive }: AccountMenuProps) {
  const { signOut, pending } = useSignOut();
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

  const itemClass = 'block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50';
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex max-w-[200px] items-center gap-1 text-[15px] font-medium text-gray-900 transition-opacity hover:opacity-60',
          myPageActive && 'font-semibold',
        )}
      >
        <span className="truncate">{companyName || '마이페이지'}</span>
        <span
          aria-hidden="true"
          className={cn(
            'block size-4 shrink-0 text-gray-500',
            open ? 'icon-[lucide--chevron-up]' : 'icon-[lucide--chevron-down]',
          )}
        />
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
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className={itemClass}
            >
              로그아웃
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
