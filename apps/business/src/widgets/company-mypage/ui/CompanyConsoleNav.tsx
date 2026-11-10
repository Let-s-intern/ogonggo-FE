'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ogonggo/ui';
import { COMPANY_CONSOLE_NAV, isConsoleNavActive } from '../model/menu';

export interface CompanyConsoleNavProps {
  /** 메뉴 오른쪽 건수. 키는 메뉴의 `href` 다. 없는 항목은 숫자를 그리지 않는다 — 0 과 모름은 다르다. */
  counts?: Readonly<Record<string, number | undefined>>;
  /** `side` 는 PC 왼쪽 세로 메뉴, `bar` 는 모바일 상단 가로 메뉴(밀어서 본다). */
  variant: 'side' | 'bar';
}

/**
 * 기업 회원 콘솔의 메뉴(`model/menu.ts` 의 `COMPANY_CONSOLE_NAV`). 현재 항목은 경로로 고른다. 하위 경로(작성·수정
 * 화면)에서도 그 목록 메뉴가 켜져 있다.
 */
export function CompanyConsoleNav({ counts, variant }: CompanyConsoleNavProps) {
  const pathname = usePathname();

  if (variant === 'bar') {
    return (
      <nav
        aria-label="기업 회원 메뉴"
        className="overflow-x-auto border-b border-gray-200 bg-white"
      >
        <ul className="flex min-w-max gap-5 px-5">
          {COMPANY_CONSOLE_NAV.flatMap((section) => section.items).map((item) => {
            const current = isConsoleNavActive(item, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    '-mb-px flex h-12 items-center border-b-2 text-[15px] whitespace-nowrap transition-colors duration-200',
                    current
                      ? 'border-gray-900 font-semibold text-gray-900'
                      : 'border-transparent text-gray-500',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="기업 회원 메뉴" className="flex flex-col gap-6 px-3 py-6">
      {COMPANY_CONSOLE_NAV.map((section, index) => (
        <div key={section.title ?? index}>
          {section.title ? (
            <p className="mb-1.5 px-3 text-xs font-semibold text-gray-400">{section.title}</p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const current = isConsoleNavActive(item, pathname);
              const count = counts?.[item.href];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'flex h-10 items-center gap-2.5 rounded-md px-3 text-[15px] transition-colors duration-200',
                      current
                        ? 'bg-blue-50 font-semibold text-blue-600'
                        : 'text-gray-600 hover:bg-gray-200/60 hover:text-gray-900',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn('block size-[18px] shrink-0', item.icon)}
                    />
                    <span className="flex-1">{item.label}</span>
                    {count === undefined ? null : (
                      <span
                        className={cn(
                          'text-sm font-medium motion-safe:animate-[ogonggo-biz-fade-in_0.3s_ease-out]',
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
        </div>
      ))}
    </nav>
  );
}
