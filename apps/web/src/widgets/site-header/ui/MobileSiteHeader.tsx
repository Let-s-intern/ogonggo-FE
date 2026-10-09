'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, MenuItem, cn } from '@ogonggo/ui';
import { InstallAppButton, useInstallState } from '@/features/install-app';
import { SignOutButton } from '@/features/sign-out';
import { CONTACT_DIALOG_COPY, ContactEmailDialog } from '@/shared/ui/ContactEmailDialog';
import { onAdminLinkClick } from '@/shared/api/adminHandoff';
import { CalendarIcon, MenuIcon } from '@/shared/ui/icons';
import { hasBottomNav } from './MobileBottomNav';
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
 * 두 줄이다. 윗줄은 로고와 `앱 다운로드`(또는 `로그인`)·햄버거, 아랫줄은 목록 탭 넷과 달력
 * 아이콘이다. 데스크톱 우측에 있던 `공고 등록`·`마이페이지`·`로그아웃` 은 햄버거 메뉴 안으로 들어간다.
 * 로그인하지 않았으면 `로그인` 도 메뉴 안에 있다.
 */
export function MobileSiteHeader({
  pathname,
  signedIn,
  registerHref,
  myPageHref,
  adminOrigin,
}: MobileSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  // 메뉴는 누르면 닫히며 사라지므로 광고 문의 모달은 메뉴 밖, 여기서 띄운다.
  const [adInquiryOpen, setAdInquiryOpen] = useState(false);
  const calendarActive = pathname.startsWith('/calendar');
  const install = useInstallState();

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

      {/* 앱을 설치하고 로그인해 하단 내비게이션(`MobileBottomNav`)이 떠 있으면 같은 탭이 위아래로 두 번 보이지 않게
          이 줄을 숨긴다. 공고 달력은 하단 채용공고 탭의 서브 메뉴로 간다. */}
      {hasBottomNav(install.kind === 'installed', signedIn) ? null : (
        <div className="flex h-11 items-stretch justify-between px-4">
          {/* 탭 넷이 360px 에서도 한 줄에 들어가도록 글자 14px, 간격 8px 이다(Pretendard 로 잰 글자 폭 합 266px +
              간격 24px 가 쓸 수 있는 폭 304px 안에 든다). 그보다 좁은 폰에서만 이 묶음이 가로로 밀리고, 달력
              아이콘은 제자리에 있다. `whitespace-nowrap` 이 없으면 좁을 때 글자가 음절 사이에서 줄바꿈된다.
              `overflow-x-auto` 는 세로도 잘라서 탭의 키보드 포커스 링이 위·아래·왼쪽에서 잘리므로 사방 4px 안쪽 여백을
              두고 위·아래·왼쪽은 같은 크기의 음수 바깥 여백으로 되돌려 자리를 그대로 둔다. 오른쪽은 되돌리지 않는다 —
              되돌리면 좁은 폰에서 묶음의 잘리는 경계가 달력 아이콘 안으로 4px 들어가 글자가 아이콘에 닿는다. */}
          <nav className="-my-1 -ml-1 flex min-w-0 items-stretch gap-2 overflow-x-auto p-1 whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_ITEMS.map(({ href, mobileLabel, matches }) => {
              const active = matches(pathname);
              return (
                <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
                  <MenuItem
                    state={active ? 'current' : 'default'}
                    className={cn('h-full text-sm', active && 'font-semibold')}
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
      )}

      {open ? (
        <MobileMenu
          signedIn={signedIn}
          registerHref={registerHref}
          myPageHref={myPageHref}
          adminOrigin={adminOrigin}
          onClose={() => setOpen(false)}
          onAdInquiry={() => setAdInquiryOpen(true)}
        />
      ) : null}
      <ContactEmailDialog
        open={adInquiryOpen}
        onClose={() => setAdInquiryOpen(false)}
        {...CONTACT_DIALOG_COPY.advertisement}
      />
    </div>
  );
}

/**
 * 로고와 가운데 버튼 하나, 그리고 오른쪽 끝 버튼 하나. 헤더와 메뉴가 같은 줄을 쓴다.
 *
 * 가운데 버튼은 로그인하지 않았을 때만 있다. 웹 앱을 아직 설치하지 않았으면 `앱 다운로드` 이고,
 * 설치했으면(설치된 앱으로 열었거나 이 브라우저에서 설치함) 그 자리에 `로그인` 이 돌아온다
 * (`features/install-app`). 설치 여부는 브라우저에서만 알 수 있어 서버 렌더와 첫 하이드레이션에서는
 * 비워 둔다 — 설치한 사람에게 `앱 다운로드` 가 잠깐 보였다 바뀌는 것을 막는다.
 */
function TopRow({ signedIn, children }: { signedIn: boolean; children: ReactNode }) {
  const install = useInstallState();

  return (
    <div className="flex h-14 items-center justify-between px-4">
      <ServiceLogoToggle size="mobile" />
      <div className="flex items-center gap-4">
        {signedIn || install.kind === 'unknown' ? null : install.kind === 'installed' ? (
          <Button size="sm" asChild className="rounded-full px-4">
            <Link href="/login">로그인</Link>
          </Button>
        ) : (
          <InstallAppButton />
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
 * `광고 상품 문의하기` 는 메뉴를 닫고 문의할 이메일을 모달로 알린다 — `ForBusinessBanner` 의 같은
 * 버튼과 같다(`ContactEmailDialog`).
 *
 * `내 계정` 묶음이 맨 위에 온다. 로그인했으면 `마이페이지`·`어드민`·`로그아웃`(데스크톱 우측의 것들),
 * 안 했으면 `로그인` 이다 — 헤더 윗줄의 로그인 자리는 `앱 다운로드` 가 쓴다.
 */
function MobileMenu({
  signedIn,
  registerHref,
  myPageHref,
  adminOrigin,
  onClose,
  onAdInquiry,
}: Omit<MobileSiteHeaderProps, 'pathname'> & { onClose: () => void; onAdInquiry: () => void }) {
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
        {/* 내 계정이 맨 위다 — 로그인 안 했으면 `로그인`, 했으면 `마이페이지` 가 첫 항목으로 먼저 보인다. */}
        {signedIn ? (
          <MenuSection title="내 계정" links={account} onNavigate={onClose}>
            <li className="flex h-[58px] items-center">
              <SignOutButton />
            </li>
          </MenuSection>
        ) : (
          <MenuSection
            title="내 계정"
            links={[{ label: '로그인', href: '/login' }]}
            onNavigate={onClose}
          />
        )}
        <MenuSection title="공고" links={postings} onNavigate={onClose} />
        <MenuSection
          title="기업 서비스"
          links={[{ label: '공고 등록하기', href: registerHref }]}
          onNavigate={onClose}
        >
          <li>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAdInquiry();
              }}
              className="flex h-[58px] w-full items-center text-base text-gray-900"
            >
              광고 상품 문의하기
            </button>
          </li>
        </MenuSection>
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
