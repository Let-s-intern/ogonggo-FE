'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, cn } from '@ogonggo/ui';

/**
 * `matches`는 그 메뉴에 밑줄이 붙는 경로들이다. 채용공고는 목록(`/`)과 상세(`/jobs/1`)가
 * 경로 접두사를 공유하지 않아 따로 적는다 — 접두사만 보면 `/`가 모든 경로에 걸린다.
 */
const NAV_ITEMS = [
  {
    href: '/',
    label: '채용공고',
    matches: (path: string) => path === '/' || path.startsWith('/jobs'),
  },
  {
    href: '/bootcamps',
    label: '교육·부트캠프',
    matches: (path: string) => path.startsWith('/bootcamps'),
  },
  {
    href: '/side-studies',
    label: '사이드·스터디',
    matches: (path: string) => path.startsWith('/side-studies'),
  },
] as const;

/**
 * `home.png`·`교육부트캠프.png`의 상단 헤더. 현재 경로에 밑줄이 붙어야 해서 `usePathname`을
 * 쓰는 클라이언트 컴포넌트다.
 *
 * 우측 메뉴 중 `공고 달력`만 대상 화면(`/calendar`)이 생겨 링크다. `공고 등록`은 아직 화면이
 * 없어(PRD 1절) 비활성 스타일의 `<span>`으로 남는다. "로그인" 버튼도 같은 이유로 `Button`을
 * `Link`로 감싸지 않아 클릭해도 아무 일도 일어나지 않는다.
 *
 * 우측 메뉴의 활성 표시는 좌측과 다르다. 좌측은 밑줄(`border-b-2`)인데, 우측은 목업
 * (`docs/asset/공고달력.png`)의 `공고 달력` 화면에서도 밑줄이 없다 — 헤더 높이를 꽉 채우는
 * 좌측 탭과 달리 우측은 가운데 정렬된 짧은 줄이라 밑줄이 붙을 자리가 없다. 그래서 글자색만
 * 진해진다.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const calendarActive = pathname.startsWith('/calendar');

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-stretch justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-blue-500">오늘의 공고</span>
            <span className="text-xs font-medium text-gray-400">BY LETS CAREER</span>
          </Link>
          <nav className="flex items-stretch gap-6 text-sm font-semibold">
            {NAV_ITEMS.map(({ href, label, matches }) => {
              const active = matches(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center',
                    active ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-400',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
          <span>공고 등록</span>
          <Link
            href="/calendar"
            aria-current={calendarActive ? 'page' : undefined}
            className={calendarActive ? 'font-semibold text-gray-900' : undefined}
          >
            공고 달력
          </Link>
          <Button size="sm">로그인</Button>
        </div>
      </div>
    </header>
  );
}
