'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ogonggo/ui';
import type { MyPageMenuItem } from '../model/menu';

export interface MyPageTabsProps {
  menuItems: readonly MyPageMenuItem[];
  /**
   * 탭 오른쪽 건수. 키는 메뉴의 `href` 다. 없는 항목은 숫자를 그리지 않는다 — 0 과 모름은 다르다.
   * `채용공고` · `부트캠프` 가 쓴다.
   */
  counts?: Readonly<Record<string, number | undefined>>;
}

/**
 * 기업 마이페이지 본문 위의 가로 탭. 좌측 사이드바(기업 카드 + 세로 메뉴)를 대신한다(2026-11-10 사용자).
 * 기업명·담당자는 탭 위 제목 줄에 있고, 기업 정보 수정은 `기업/기관 정보` 탭이다.
 *
 * 현재 탭은 경로로 고른다. 정확히 같은 경로거나 그 아래 경로면 현재 탭이다 — 작성·수정 화면에서도
 * `채용공고` 가 켜져 있어야 한다. 좁은 화면에서는 가로로 밀어 본다.
 */
export function MyPageTabs({ menuItems, counts }: MyPageTabsProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="마이페이지 메뉴" className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-6 border-b border-gray-200">
        {menuItems.map((item) => {
          const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const count = counts?.[item.href];
          return (
            <li key={item.href} className={cn(item.separated && 'md:ml-auto')}>
              <Link
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  '-mb-px flex h-12 items-center gap-1.5 border-b-2 text-base whitespace-nowrap transition-colors',
                  current
                    ? 'border-gray-900 font-semibold text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900',
                )}
              >
                {item.label}
                {count === undefined ? null : (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      current ? 'text-blue-500' : 'text-gray-400',
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
