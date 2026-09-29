'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, MenuItem, cn } from '@ogonggo/ui';
import { SignOutButton } from '@/features/sign-out';
import { onAdminLinkClick } from '@/shared/api/adminHandoff';
import { CalendarIcon, MenuIcon } from '@/shared/ui/icons';
import { NAV_ITEMS } from './navItems';
import { ServiceLogoToggle } from './ServiceLogoToggle';

export interface MobileSiteHeaderProps {
  pathname: string;
  signedIn: boolean;
  registerHref: string;
  myPageHref: string;
  /** 관리자일 때만 온다. 없으면 어드민 항목을 그리지 않는다. */
  adminOrigin?: string;
}

/**
 * 모바일 헤더(`md` 미만). 시안은 `docs/asset/v9 mobile/채용공고 상세  플로팅버튼.png` 과
 * `상단 햄버거 버튼.png` 이다(360px 폭의 두 배로 그려져 있어 값은 절반으로 읽었다).
 *
 * 두 줄이다. 윗줄은 로고와 `로그인`·햄버거, 아랫줄은 세 목록 탭과 달력 아이콘이다. 데스크톱
 * 우측에 있던 `공고 등록`·`마이페이지`·`로그아웃` 은 햄버거 메뉴 안으로 들어간다.
 */
export function MobileSiteHeader({
  pathname,
  signedIn,
  registerHref,
  myPageHref,
  adminOrigin,
}: MobileSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const calendarActive = pathname.startsWith('/calendar');

  return (
    <div className="md:hidden">
      <TopRow signedIn={signedIn}>
        <button
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="-mr-1 p-1 text-gray-900"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </TopRow>

      <div className="flex h-11 items-stretch justify-between px-4">
        <nav className="flex items-stretch gap-4">
          {NAV_ITEMS.map(({ href, mobileLabel, matches }) => {
            const active = matches(pathname);
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
                <MenuItem
                  state={active ? 'current' : 'default'}
                  className={cn('h-full text-base', active && 'font-semibold')}
                >
                  {mobileLabel}
                </MenuItem>
              </Link>
            );
          })}
        </nav>
        <Link
          href="/calendar"
          aria-label="공고 달력"
          aria-current={calendarActive ? 'page' : undefined}
          className={cn('flex items-center', calendarActive ? 'text-gray-900' : 'text-gray-700')}
        >
          <CalendarIcon className="h-6 w-6" />
        </Link>
      </div>

      {open ? (
        <MobileMenu
          signedIn={signedIn}
          registerHref={registerHref}
          myPageHref={myPageHref}
          adminOrigin={adminOrigin}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

/** 로고와 `로그인`, 그리고 오른쪽 끝 버튼 하나. 헤더와 메뉴가 같은 줄을 쓴다. */
function TopRow({ signedIn, children }: { signedIn: boolean; children: ReactNode }) {
  return (
    <div className="flex h-14 items-center justify-between px-4">
      <ServiceLogoToggle size="mobile" />
      <div className="flex items-center gap-4">
        {signedIn ? null : (
          <Button size="sm" asChild className="rounded-full px-4">
            <Link href="/login">로그인</Link>
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}

interface MenuLink {
  label: string;
  href: string;
  /** 다른 도메인(어드민)이면 `Link` 가 아니라 `a` 로 그리고, 웹 로그인을 들고 간다(`adminHandoff`). */
  external?: boolean;
}

/**
 * 햄버거 메뉴. 화면 전체를 덮는다(`상단 햄버거 버튼.png`). 항목을 누르면 이동하면서 닫힌다.
 *
 * `광고 상품 문의하기` 는 시안에 있지만 갈 곳이 아직 없다 — `ForBusinessBanner` 의 같은 버튼과
 * 같은 처지라 글자만 두고 누를 수 없게 한다.
 *
 * 로그인했으면 `내 계정` 묶음이 더해진다. 데스크톱 우측의 `마이페이지`·`어드민`·`로그아웃` 이
 * 모바일에서 갈 곳이 여기다.
 */
function MobileMenu({
  signedIn,
  registerHref,
  myPageHref,
  adminOrigin,
  onClose,
}: Omit<MobileSiteHeaderProps, 'pathname'> & { onClose: () => void }) {
  // 메뉴가 떠 있는 동안 뒤 화면이 스크롤되지 않게 한다. Esc 로도 닫는다.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const postings: MenuLink[] = [
    { label: '전체 채용 공고', href: '/' },
    { label: '교육 · 부트캠프', href: '/bootcamps' },
    { label: '사이드 · 스터디', href: '/side-studies' },
    { label: '공고 달력', href: '/calendar' },
  ];
  const account: MenuLink[] = [{ label: '마이페이지', href: myPageHref }];
  if (adminOrigin) account.push({ label: '어드민', href: adminOrigin, external: true });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="메뉴"
      className="fixed inset-0 z-50 overflow-y-auto bg-white"
    >
      <TopRow signedIn={signedIn}>
        <button
          type="button"
          aria-label="메뉴 닫기"
          onClick={onClose}
          className="-mr-1 p-1 text-gray-900"
        >
          <span aria-hidden="true" className="icon-[lucide--x] block h-6 w-6" />
        </button>
      </TopRow>

      <nav className="flex flex-col gap-6 px-5 pt-4 pb-10">
        <MenuSection title="공고" links={postings} onNavigate={onClose} />
        <MenuSection
          title="기업 서비스"
          links={[{ label: '공고 등록하기', href: registerHref }]}
          onNavigate={onClose}
        >
          <li className="flex h-[58px] items-center text-base text-gray-400">광고 상품 문의하기</li>
        </MenuSection>
        {signedIn ? (
          <MenuSection title="내 계정" links={account} onNavigate={onClose}>
            <li className="flex h-[58px] items-center">
              <SignOutButton />
            </li>
          </MenuSection>
        ) : null}
      </nav>
    </div>
  );
}

function MenuSection({
  title,
  links,
  onNavigate,
  children,
}: {
  title: string;
  links: MenuLink[];
  onNavigate: () => void;
  children?: ReactNode;
}) {
  const itemClass = 'flex h-[58px] items-center text-base text-gray-900';
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-400">{title}</h2>
      <ul className="mt-1 divide-y divide-gray-200">
        {links.map(({ label, href, external }) => (
          <li key={label}>
            {external ? (
              <a href={href} onClick={onAdminLinkClick(href)} className={itemClass}>
                {label}
              </a>
            ) : (
              <Link href={href} onClick={onNavigate} className={itemClass}>
                {label}
              </Link>
            )}
          </li>
        ))}
        {children}
      </ul>
    </section>
  );
}
