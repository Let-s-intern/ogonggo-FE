'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { useSignOut } from '@/shared/api/useSignOut';
import { loginHref } from '@/shared/lib/returnPath';
import { AccountMenu } from './AccountMenu';
import { Logo } from './Logo';

interface NavItem {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
}

/** 시안 헤더의 왼쪽 메뉴. 광고 신청 내역은 기업 회원 화면의 왼쪽 메뉴에서 간다(2026-11-10 사용자). */
const SERVICE_NAV: NavItem[] = [
  { href: '/', label: '광고 안내', match: (p) => p === '/' },
  { href: '/apply', label: '광고 신청/문의', match: (p) => p.startsWith('/apply') },
];

/** 기업 회원 대시보드. 공고·기업 정보는 그 화면의 왼쪽 메뉴에서 간다(`CompanyConsoleNav`). */
const MY_PAGE_HREF = '/mypage/company';

/**
 * 사이트 헤더. 왼쪽은 광고 안내·광고 신청/문의, 오른쪽은 로그인. 로그인하면 로그인 자리에 기업명이 나오고,
 * 누르면 `마이페이지`·`로그아웃` 이 펼쳐진다(`AccountMenu`).
 *
 * `공고등록`·`내 기업 정보` 는 두지 않는다. 기업 회원 화면(`/mypage/company`)에 왼쪽 메뉴가 생겨 거기서 간다
 * (2026-11-10 사용자). 광고 신청 내역도 그 메뉴에서 간다.
 *
 * `마이페이지` 는 기업 회원으로 로그인했을 때만 바로 간다. 다른 역할이면
 * `/login?redirect=<그 화면>` 으로 보내고, 로그인 화면이 다른 역할에게 기업 회원으로 로그인하라고 안내한다
 * (`widgets/sign-in/LoginPage.tsx`). 역할은 `getMyAccount` 에만 있어 받기 전에는 로그인 화면으로 건다 — 기업
 * 회원이 그 사이에 누르면 로그인 화면이 바로 돌려보낸다.
 *
 * 토큰이 브라우저 저장소에만 있어 서버 렌더와 첫 화면은 늘 로그아웃 상태이고, 마운트 뒤 바뀐다.
 *
 * 모바일(md 미만)은 로고와 메뉴 버튼만 두고, 버튼을 누르면 헤더 아래에 같은 메뉴를 세로로 펼친다.
 */
export interface SiteHeaderProps {
  /**
   * `member` 는 기업 회원으로 로그인했을 때(`MemberShell`)의 헤더다. PC 에서는 헤더를 숨기고 로고·메뉴·계정이 모두
   * 왼쪽 메뉴에 있다(2026-11-10 사용자). 왼쪽 메뉴가 없는 모바일에서만 보이고, 로고는 대시보드로 가고, 메뉴 버튼
   * 대신 기업명과 로그아웃을 바로 둔다(광고 메뉴는 헤더 아래 가로 메뉴에 있다).
   */
  layout?: 'site' | 'member';
}

export function SiteHeader({ layout = 'site' }: SiteHeaderProps) {
  const isConsole = layout === 'member';
  const pathname = usePathname();
  const account = useMyAccount();
  const { signOut, pending } = useSignOut();
  const [menuOpen, setMenuOpen] = useState(false);

  const signedIn = account.kind !== 'signedOut';
  const isCompany = account.kind === 'ready' && account.account.role === 'COMPANY';
  const companyHref = (href: string) => (isCompany ? href : loginHref(href));
  const companyName =
    account.kind === 'ready' ? account.account.companyProfile?.organizationName : undefined;
  const myPageActive = pathname.startsWith('/mypage');

  // 화면을 옮기면 모바일 메뉴를 닫는다.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const accountAction = signedIn ? (
    <button
      type="button"
      onClick={() => signOut()}
      disabled={pending}
      className="text-[15px] font-medium text-gray-500 transition-colors hover:text-gray-900 disabled:text-gray-300"
    >
      로그아웃
    </button>
  ) : (
    <Link
      href={pathname === '/' ? '/login' : loginHref(pathname)}
      className="text-[15px] font-medium text-gray-500 transition-colors hover:text-gray-900"
    >
      로그인
    </Link>
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur',
        isConsole && 'md:hidden',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-4 md:px-6">
        <Link
          href={isConsole ? MY_PAGE_HREF : '/'}
          aria-label={isConsole ? '오늘의 공고 비즈니스 대시보드' : '오늘의 공고 비즈니스 홈'}
          className="flex items-end gap-1.5"
        >
          <Logo className="h-[22px] w-[46px] text-blue-500" />
          <span className="text-sm font-semibold text-gray-600">for business</span>
        </Link>
        <nav aria-label="주요 메뉴" className="hidden h-full items-center gap-5 md:flex">
          {SERVICE_NAV.map((item) => (
            <DesktopLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={item.match(pathname)}
            />
          ))}
        </nav>
        <nav aria-label="계정 메뉴" className="ml-auto hidden h-full items-center gap-5 md:flex">
          {signedIn ? (
            <AccountMenu
              companyName={companyName}
              myPageHref={companyHref(MY_PAGE_HREF)}
              myPageActive={myPageActive}
            />
          ) : (
            accountAction
          )}
        </nav>
        {isConsole ? (
          // 기업 회원 틀의 모바일은 메뉴가 헤더 아래 가로 메뉴에 다 있어 펼칠 것이 계정뿐이다. 펼치지 않고 기업명과
          // 로그아웃을 바로 둔다(2026-11-10 검수).
          <div className="ml-auto flex min-w-0 items-center gap-3 md:hidden">
            {companyName ? (
              <span className="truncate text-sm font-semibold text-gray-900">{companyName}</span>
            ) : null}
            <button
              type="button"
              onClick={() => signOut()}
              disabled={pending}
              className="shrink-0 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900 disabled:text-gray-300"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
            aria-controls="site-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="-mr-1 ml-auto p-1 text-gray-900 md:hidden"
          >
            <span
              aria-hidden="true"
              className={cn('block size-6', menuOpen ? 'icon-[lucide--x]' : 'icon-[lucide--menu]')}
            />
          </button>
        )}
      </div>
      {menuOpen && !isConsole ? (
        <nav
          id="site-mobile-menu"
          aria-label="메뉴"
          className="border-t border-gray-100 bg-white px-4 pt-2 pb-4 md:hidden"
        >
          <ul>
            {SERVICE_NAV.map((item) => (
              <MobileLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={item.match(pathname)}
              />
            ))}
          </ul>
          <ul className="mt-2 border-t border-gray-100 pt-2">
            {signedIn ? (
              <MobileLink
                href={companyHref(MY_PAGE_HREF)}
                label={companyName ? `마이페이지 (${companyName})` : '마이페이지'}
                active={myPageActive}
              />
            ) : null}
            <li className="flex h-12 items-center">{accountAction}</li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function DesktopLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-full items-center border-b-2 text-[15px] font-medium transition-colors',
        active
          ? 'border-gray-900 text-gray-900'
          : 'border-transparent text-gray-500 hover:text-gray-900',
      )}
    >
      {label}
    </Link>
  );
}

function MobileLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex h-12 items-center text-[15px] font-medium',
          active ? 'text-gray-900' : 'text-gray-500',
        )}
      >
        {label}
      </Link>
    </li>
  );
}
