'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ogonggo/ui';
import { Logo } from './Logo';

/**
 * 시안 헤더에서 백엔드 없이 동작하는 메뉴만 둔다. `광고 내역`·`공고등록`·`내 기업 정보`·`로그인` 은
 * 기업 회원 API 를 붙일 때 다시 넣는다.
 */
const NAV = [
  { href: '/', label: '광고 안내', match: (p: string) => p === '/' },
  { href: '/apply', label: '광고 신청/문의', match: (p: string) => p.startsWith('/apply') },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-4 md:px-6">
        <Link href="/" aria-label="오늘의 공고 비즈니스 홈" className="flex items-end gap-1.5">
          <Logo className="h-[22px] w-[46px] text-blue-500" />
          <span className="text-sm font-semibold text-gray-600">for business</span>
        </Link>
        <nav aria-label="주요 메뉴" className="flex h-full items-center gap-5">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full items-center border-b-2 text-[15px] font-medium transition-colors',
                  active
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
