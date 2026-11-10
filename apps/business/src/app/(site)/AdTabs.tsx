'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ogonggo/ui';

const TABS = [
  {
    href: '/apply',
    label: '광고 신청/문의',
    match: (p: string) => p === '/apply' || p.startsWith('/apply/'),
  },
  { href: '/', label: '광고 안내', match: (p: string) => p === '/' },
] as const;

/** 탭을 다는 화면. 광고 신청/문의(`/apply` 아래)와 광고 안내(`/`)다. */
export const hasAdTabs = (pathname: string) => TABS.some((tab) => tab.match(pathname));

/**
 * 기업 회원으로 로그인했을 때 광고 신청/문의 화면 위의 탭. 왼쪽 메뉴에는 `광고 신청/문의` 하나만 두고, 광고 안내
 * (랜딩)는 이 탭으로 들어간다(2026-11-10 사용자). 폭은 랜딩·신청 화면의 본문 폭(`max-w-[1200px]`)과 같다.
 */
export function AdTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="광고 메뉴" className="border-b border-gray-200 bg-white">
      <ul className="mx-auto flex w-full max-w-[1200px] gap-6 px-4 md:px-6">
        {TABS.map((tab) => {
          const current = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  '-mb-px flex h-12 items-center border-b-2 text-[15px] transition-colors duration-200',
                  current
                    ? 'border-gray-900 font-semibold text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900',
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
