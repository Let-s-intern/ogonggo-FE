'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore, type CSSProperties } from 'react';
import { cn } from '@ogonggo/ui';
import { isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { myPageIndexFor } from '@/widgets/mypage-sidebar';
import { NAV_ITEMS } from './navItems';

/**
 * 탭마다의 아이콘. Iconify 플러그인이 소스의 이 문자열을 찾아 그리므로 글자 그대로 적는다
 * (`packages/ui/src/styles/tokens.css`).
 */
const LIST_ICONS: Record<(typeof NAV_ITEMS)[number]['href'], string> = {
  '/': 'icon-[lucide--briefcase-business]',
  '/bootcamps': 'icon-[lucide--graduation-cap]',
  '/side-studies': 'icon-[lucide--users-round]',
};

/**
 * 상세 화면. 화면 아래에 신청하기 바(`shared/ui/StickyApplyBar.tsx`)가 붙어 있어 내비게이션을 두면
 * 둘이 겹친다. 앱의 탭 바가 상세 화면에서 물러나는 것과 같이 여기서는 그리지 않는다.
 */
const DETAIL_PATH = /^\/(jobs|bootcamps|side-studies)\/[^/]+/;

/**
 * 모바일에서 로그인했을 때 화면 아래에 붙는 내비게이션. 채용공고·교육·부트캠프·사이드·스터디·
 * 마이페이지 네 탭이다. 로그인 전에는 헤더의 `앱 다운로드`·`로그인` 이 먼저이고(`MobileSiteHeader`),
 * 데스크톱은 헤더 탭이 이 일을 한다.
 *
 * 바의 위 변은 지금 탭 자리만 반원으로 파여 있고, 그 위에 지금 탭의 아이콘이 파란 동그라미로 떠 있다.
 * 파인 자리와 동그라미의 가로 위치는 CSS 변수 `--notch-x` 하나가 정한다. `@property` 로 등록해 두어
 * 페이지를 옮기면 그 값이 새 탭 자리로 미끄러지듯 바뀐다(`app/globals.css`, `ogonggo-bottom-nav`).
 * 네 탭 어디에도 속하지 않는 화면(공고 달력, 공지 등)에서는 파인 자리 없이 평평한 바만 둔다.
 *
 * 이 바가 떠 있는 동안 본문 끝과 오른쪽 아래 플로팅 버튼이 가리지 않도록, 바는
 * `data-bottom-nav` 를 달고 그 둘이 이 표시를 보고 비켜선다(`globals.css`, `ServiceFeedbackButton`).
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const signedIn = useSyncExternalStore(subscribeTokens, isSignedIn, () => false);
  const accountState = useMyAccount();
  const role = accountState.kind === 'ready' ? accountState.account.role : undefined;

  if (!signedIn || DETAIL_PATH.test(pathname)) {
    return null;
  }

  const tabs = [
    ...NAV_ITEMS.map(({ href, label, matches }) => ({
      href,
      label,
      icon: LIST_ICONS[href],
      active: matches(pathname),
    })),
    {
      // 모바일 마이페이지는 역할마다 첫 화면(메뉴)이 다르다. 헤더 메뉴의 마이페이지와 같은 곳이다.
      href: myPageIndexFor(role === 'COMPANY' ? 'COMPANY' : 'USER'),
      label: '마이페이지',
      icon: 'icon-[lucide--user-round]',
      active: pathname.startsWith('/mypage'),
    },
  ];
  const activeIndex = tabs.findIndex((tab) => tab.active);
  const activeTab = tabs[activeIndex];
  const style = {
    '--notch-x': `${((Math.max(activeIndex, 0) + 0.5) / tabs.length) * 100}%`,
  } as CSSProperties;

  return (
    <nav
      data-bottom-nav
      aria-label="주요 메뉴"
      style={style}
      className="ogonggo-bottom-nav fixed inset-x-0 bottom-0 z-30 md:hidden"
    >
      {/* 바 몸통. 그림자는 파인 모양을 따라가도록 바깥 한 겹에 `drop-shadow` 로 건다. */}
      <div className="drop-shadow-[0_-2px_10px_rgba(17,24,39,0.08)]">
        <div
          className={cn(
            'h-[calc(64px+env(safe-area-inset-bottom))] bg-white',
            activeTab && 'ogonggo-bottom-nav-notch',
          )}
        />
      </div>

      {activeTab ? (
        // 파인 자리 위에 떠 있는 동그라미. 지금 탭 링크와 같은 곳으로 가지만 탭 목록에 같은 링크가
        // 이미 있어 보조기술과 탭 순서에서는 뺀다.
        <Link
          href={activeTab.href}
          aria-hidden="true"
          tabIndex={-1}
          className="ogonggo-bottom-nav-bubble absolute -top-5 flex size-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30"
        >
          <span
            key={activeTab.href}
            className={cn(activeTab.icon, 'ogonggo-pop-in block h-6 w-6')}
          />
        </Link>
      ) : null}

      <ul className="absolute inset-x-0 top-0 grid h-16 grid-cols-4">
        {tabs.map((tab) => (
          <li key={tab.label}>
            <Link
              href={tab.href}
              aria-current={tab.active ? 'page' : undefined}
              className="flex h-full flex-col items-center justify-end gap-1 pb-2.5"
            >
              {/* 지금 탭의 아이콘은 위 동그라미가 보여 준다. 자리만 남겨 글자 높이를 맞춘다. */}
              <span
                aria-hidden="true"
                className={cn(tab.icon, 'block h-6 w-6 text-gray-400', tab.active && 'invisible')}
              />
              <span
                className={cn(
                  'text-[11px] leading-none',
                  tab.active ? 'font-semibold text-blue-500' : 'text-gray-500',
                )}
              >
                {tab.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
