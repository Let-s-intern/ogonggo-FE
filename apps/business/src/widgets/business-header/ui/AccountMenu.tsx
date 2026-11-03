'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { cn } from '@ogonggo/ui';
import { useSignOut } from '@/features/sign-out';
import { AccountIcon, ChevronIcon } from '@/shared/ui/icons';

export interface AccountMenuProps {
  /** `{이름} 님` 의 이름. 계정을 아직 못 읽었으면 `마이페이지` 로 적는다. */
  name?: string;
  myPageActive: boolean;
}

/**
 * 헤더 우측의 `[사람] {이름} 님`. 누르면 `마이페이지` · `로그아웃` 이 펼쳐진다. web 의
 * `widgets/site-header/ui/AccountMenu.tsx` 와 같은 모양이고 `어드민` 항목이 없다.
 *
 * 마이페이지에서 로그아웃하면 랜딩으로 보낸다. 마이페이지의 로그인 가드는 들어올 때만 검사한다.
 */
export function AccountMenu({ name, myPageActive }: AccountMenuProps) {
  const { signOut, pending } = useSignOut();
  const rootRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const itemClass = 'block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50';
  return (
    <div ref={rootRef} className="relative">
      <details ref={detailsRef} className="group">
        <summary
          className={cn(
            'flex cursor-pointer list-none items-center gap-1.5 text-sm text-gray-900 transition-opacity hover:opacity-60 [&::-webkit-details-marker]:hidden',
            myPageActive && 'font-semibold',
          )}
        >
          <AccountIcon className="h-5 w-5 text-gray-900" />
          <span className="max-w-32 truncate">{name ? `${name} 님` : '마이페이지'}</span>
          <ChevronIcon direction="down" className="h-4 w-4 text-gray-500 group-open:rotate-180" />
        </summary>
        <ul
          role="menu"
          className="absolute right-0 z-20 mt-2 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-md"
        >
          <li role="none">
            <Link
              role="menuitem"
              href="/mypage/company"
              aria-current={myPageActive ? 'page' : undefined}
              onClick={close}
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
                close();
                void signOut(myPageActive ? '/' : undefined);
              }}
              className={itemClass}
            >
              로그아웃
            </button>
          </li>
        </ul>
      </details>
    </div>
  );
}
