'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import { cn } from '@ogonggo/ui';
import { useInstallState } from '@/features/install-app';
import { openServiceFeedback } from '@/features/service-feedback';
import { isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { myPageIndexFor } from '@/widgets/mypage-sidebar';

/**
 * 상세 화면. 화면 아래에 신청하기 바(`shared/ui/StickyApplyBar.tsx`)가 붙어 있어 내비게이션을 두면
 * 둘이 겹친다. 앱의 탭 바가 상세 화면에서 물러나는 것과 같이 여기서는 그리지 않는다.
 */
const DETAIL_PATH = /^\/(jobs|bootcamps|side-studies)\/[^/]+/;

/**
 * 이 화면에 하단 내비게이션이 뜨는지. 웹 앱을 설치했고(`features/install-app`) 로그인했을 때만이다 —
 * 설치 → 로그인 → 하단 내비게이션 순서로 앱처럼 쓰는 사람을 위한 것이다. 모바일(`md` 미만)인지는 CSS 가
 * 가린다(`md:hidden`). 모바일 헤더가 이것을 보고 둘째 줄 탭을 숨긴다 — 같은 탭이 위아래로 두 번 보이지
 * 않게 한다(`MobileSiteHeader`).
 */
export function hasBottomNav(installed: boolean, signedIn: boolean, pathname: string): boolean {
  return installed && signedIn && !DETAIL_PATH.test(pathname);
}

interface SubMenuItem {
  label: string;
  icon: string;
  /** 이동할 곳. 없으면 `onSelect` 를 부른다(이동 없이 창을 여는 항목). */
  href?: string;
  onSelect?: () => void;
}

/**
 * 서비스 개선 의견. 모바일 로그인 화면에서는 오른쪽 아래 플로팅 버튼이 탭을 가려 숨기고 이 항목이
 * 대신한다(`features/service-feedback`).
 */
const FEEDBACK_ITEM: SubMenuItem = {
  label: '의견 보내기',
  icon: 'icon-[lucide--smile-plus]',
  onSelect: openServiceFeedback,
};

interface Tab {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  /** 지금 탭을 한 번 더 누르면 동그라미 위로 펼쳐지는 바로가기. */
  subMenu: SubMenuItem[];
}

/**
 * 탭 네 개와 각 탭의 서브 메뉴. 아이콘 클래스는 Iconify 플러그인이 소스의 이 문자열을 찾아 그리므로
 * 글자 그대로 적는다(`packages/ui/src/styles/tokens.css`). 마이페이지는 역할마다 주소가 다르다.
 */
function buildTabs(pathname: string, company: boolean): Tab[] {
  return [
    {
      href: '/',
      label: '채용공고',
      icon: 'icon-[lucide--briefcase-business]',
      // 공고 달력은 채용공고의 서브 메뉴라 그 화면에서도 채용공고 탭이 켜진다.
      active: pathname === '/' || pathname.startsWith('/jobs') || pathname.startsWith('/calendar'),
      subMenu: [
        { label: '공고 달력', href: '/calendar', icon: 'icon-[lucide--calendar-days]' },
        { label: '스크랩한 공고', href: '/mypage/scraps', icon: 'icon-[lucide--bookmark]' },
      ],
    },
    {
      href: '/bootcamps',
      label: '교육·부트캠프',
      icon: 'icon-[lucide--graduation-cap]',
      active: pathname.startsWith('/bootcamps'),
      subMenu: [
        {
          label: '스크랩한 교육',
          href: '/mypage/scraps?tab=bootcamps',
          icon: 'icon-[lucide--bookmark]',
        },
      ],
    },
    {
      href: '/side-studies',
      label: '사이드·스터디',
      icon: 'icon-[lucide--users-round]',
      active: pathname.startsWith('/side-studies'),
      subMenu: [
        { label: '모집글 쓰기', href: '/mypage/posts/new', icon: 'icon-[lucide--square-pen]' },
        { label: '작성한 모집글', href: '/mypage/posts', icon: 'icon-[lucide--file-text]' },
      ],
    },
    {
      href: myPageIndexFor(company ? 'COMPANY' : 'USER'),
      label: '마이페이지',
      icon: 'icon-[lucide--user-round]',
      active: pathname.startsWith('/mypage'),
      subMenu: company
        ? [
            {
              label: '공고 관리',
              href: '/mypage/company/posts',
              icon: 'icon-[lucide--clipboard-list]',
            },
            {
              label: '기업 정보',
              href: '/mypage/company/profile',
              icon: 'icon-[lucide--user-round-cog]',
            },
            FEEDBACK_ITEM,
          ]
        : [
            {
              label: '지원·신청 관리',
              href: '/mypage/applications',
              icon: 'icon-[lucide--clipboard-list]',
            },
            { label: '개인 정보', href: '/mypage/profile', icon: 'icon-[lucide--user-round-cog]' },
            FEEDBACK_ITEM,
          ],
    },
  ];
}

/**
 * 모바일에서 웹 앱을 설치하고 로그인했을 때 화면 아래에 붙는 내비게이션. 채용공고·교육·부트캠프·사이드·스터디·
 * 마이페이지 네 탭이다. 로그인 전에는 헤더의 `앱 다운로드`·`로그인` 이 먼저이고(`MobileSiteHeader`),
 * 데스크톱은 헤더 탭이 이 일을 한다.
 *
 * 바의 위 변은 지금 탭 자리만 반원으로 파여 있고, 그 위에 지금 탭의 아이콘이 파란 동그라미로 떠 있다.
 * 파인 자리와 동그라미의 가로 위치는 CSS 변수 `--notch-x` 하나가 정한다. `@property` 로 등록해 두어
 * 페이지를 옮기면 그 값이 새 탭 자리로 미끄러지듯 바뀐다(`app/globals.css`, `ogonggo-bottom-nav`).
 * 네 탭 어디에도 속하지 않는 화면(공지 등)에서는 파인 자리 없이 평평한 바만 둔다.
 *
 * 지금 탭(또는 떠 있는 동그라미)을 한 번 더 누르면 동그라미 위로 그 탭의 서브 메뉴가 차례로 솟아오른다.
 * 채용공고는 공고 달력, 사이드·스터디는 모집글 쓰기처럼 그 화면에서 다음에 할 일로 바로 간다. 동그라미의
 * 작은 꺾쇠가 펼칠 것이 있다는 표시다. 바깥을 누르거나 Esc, 페이지 이동으로 닫힌다.
 *
 * 이 바가 떠 있는 동안 본문 끝과 오른쪽 아래 플로팅 버튼이 가리지 않도록, 바는
 * `data-bottom-nav` 를 달고 그 둘이 이 표시를 보고 비켜선다(`globals.css`, `ServiceFeedbackButton`).
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const signedIn = useSyncExternalStore(subscribeTokens, isSignedIn, () => false);
  const installed = useInstallState().kind === 'installed';
  const accountState = useMyAccount();
  const company = accountState.kind === 'ready' && accountState.account.role === 'COMPANY';
  const [subMenuOpen, setSubMenuOpen] = useState(false);

  // 다른 화면으로 가면 펼친 서브 메뉴를 접는다.
  useEffect(() => setSubMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!subMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSubMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [subMenuOpen]);

  if (!hasBottomNav(installed, signedIn, pathname)) {
    return null;
  }

  const tabs = buildTabs(pathname, company);
  const activeIndex = tabs.findIndex((tab) => tab.active);
  const activeTab = tabs[activeIndex];
  const style = {
    '--notch-x': `${((Math.max(activeIndex, 0) + 0.5) / tabs.length) * 100}%`,
  } as CSSProperties;

  /** 지금 탭을 다시 누르면 이동하지 않고 서브 메뉴를 여닫는다. 다른 탭은 그대로 이동한다. */
  const onTabClick = (tab: Tab) => (event: MouseEvent) => {
    if (!tab.active || tab.subMenu.length === 0) return;
    event.preventDefault();
    setSubMenuOpen((open) => !open);
  };

  return (
    <>
      {subMenuOpen ? (
        // 서브 메뉴 뒤를 살짝 어둡게 덮는다. 누르면 닫힌다. 바(`z-30`)보다 한 칸 아래다.
        <div
          aria-hidden="true"
          onClick={() => setSubMenuOpen(false)}
          className="ogonggo-fade-in fixed inset-0 z-[29] bg-gray-950/30 md:hidden"
        />
      ) : null}
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

        {activeTab && subMenuOpen ? (
          <SubMenu
            tab={activeTab}
            index={activeIndex}
            count={tabs.length}
            onClose={() => setSubMenuOpen(false)}
          />
        ) : null}

        {activeTab ? (
          // 파인 자리 위에 떠 있는 동그라미. 누르면 지금 탭을 다시 누른 것과 같다. 탭 목록에 같은
          // 링크가 있어 보조기술과 탭 순서에서는 뺀다.
          <Link
            href={activeTab.href}
            aria-hidden="true"
            tabIndex={-1}
            onClick={onTabClick(activeTab)}
            className="ogonggo-bottom-nav-bubble absolute -top-5 flex size-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30"
          >
            <span
              key={activeTab.href}
              className={cn(activeTab.icon, 'ogonggo-pop-in block h-6 w-6')}
            />
            {activeTab.subMenu.length > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-white text-blue-500 shadow">
                <span
                  className={cn(
                    'icon-[lucide--chevron-up] block h-3 w-3 transition-transform',
                    subMenuOpen && 'rotate-180',
                  )}
                />
              </span>
            ) : null}
          </Link>
        ) : null}

        <ul className="absolute inset-x-0 top-0 grid h-16 grid-cols-4">
          {tabs.map((tab) => (
            <li key={tab.label}>
              <Link
                href={tab.href}
                aria-current={tab.active ? 'page' : undefined}
                aria-expanded={tab.active && tab.subMenu.length > 0 ? subMenuOpen : undefined}
                onClick={onTabClick(tab)}
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
    </>
  );
}

/**
 * 동그라미 위로 솟아오르는 서브 메뉴. 동그라미에 가까운 것부터 차례로 늦게 올라온다. 가장자리 탭에서는
 * 화면 밖으로 나가지 않도록 그 쪽 가장자리에 맞추고, 가운데 탭은 동그라미 가운데에 맞춘다.
 */
function SubMenu({
  tab,
  index,
  count,
  onClose,
}: {
  tab: Tab;
  index: number;
  count: number;
  onClose: () => void;
}) {
  const align = index === 0 ? 'left' : index === count - 1 ? 'right' : 'center';

  return (
    <ul
      aria-label={`${tab.label} 바로가기`}
      className={cn(
        'absolute bottom-[calc(100%+36px)] flex flex-col-reverse gap-2',
        align === 'left' && 'left-3 items-start',
        align === 'right' && 'right-3 items-end',
        align === 'center' && 'ogonggo-bottom-nav-submenu items-center',
      )}
    >
      {tab.subMenu.map((item, order) => (
        <li
          key={item.label}
          className="ogonggo-rise-in"
          style={{ animationDelay: `${order * 60}ms` }}
        >
          {item.href ? (
            <Link href={item.href} className={SUB_MENU_ITEM_CLASS}>
              <SubMenuIcon icon={item.icon} />
              {item.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                item.onSelect?.();
              }}
              className={SUB_MENU_ITEM_CLASS}
            >
              <SubMenuIcon icon={item.icon} />
              {item.label}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

const SUB_MENU_ITEM_CLASS =
  'flex items-center gap-2 rounded-full bg-white py-2.5 pr-4 pl-3 text-sm font-semibold whitespace-nowrap text-gray-800 shadow-lg';

function SubMenuIcon({ icon }: { icon: string }) {
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-blue-50 text-blue-500">
      <span aria-hidden="true" className={cn(icon, 'block h-4 w-4')} />
    </span>
  );
}
