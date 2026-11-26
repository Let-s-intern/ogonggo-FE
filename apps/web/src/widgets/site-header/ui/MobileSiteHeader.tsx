'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Button } from '@ogonggo/ui';
import { InstallAppButton, useInstallState } from '@/features/install-app';
import { NotificationBellLink } from '@/features/notification-inbox';
import { SignOutButton } from '@/features/sign-out';
import { CONTACT_DIALOG_COPY, ContactEmailDialog } from '@/shared/ui/ContactEmailDialog';
import { onAdminLinkClick } from '@/shared/api/adminHandoff';
import { BIZ_DASHBOARD_PATH, bizUrl, onBizLinkClick } from '@/shared/api/bizHandoff';
import type { CompanyJobRegisterLink } from '@/shared/lib/companyJobRegister';
import { MenuIcon } from '@/shared/ui/icons';
import { ReportEntry } from '@/widgets/report-entry';
import { ReportNavLabel } from './ReportNavLabel';
import { ServiceLogoToggle } from './ServiceLogoToggle';

export interface MobileSiteHeaderProps {
  pathname: string;
  signedIn: boolean;
  /** `공고 등록하기` 가 갈 곳. 비즈 오공고다(`companyJobRegisterLink`). */
  register: CompanyJobRegisterLink;
  myPageHref: string;
  /** 관리자일 때만 온다. 없으면 어드민 항목을 그리지 않는다. */
  adminOrigin?: string;
  /** 기업 회원이면 `true`. `내 계정` 에 `비즈 오공고` 가 더해진다(이슈 #649). */
  showBiz?: boolean;
}

/**
 * 모바일 헤더(`md` 미만). 시안은 `docs/asset/v9 mobile/채용공고 상세  플로팅버튼.png` 과
 * `상단 햄버거 버튼.png` 이다(360px 폭의 두 배로 그려져 있어 값은 절반으로 읽었다).
 *
 * 한 줄이다. 로고와 `앱 다운로드`(또는 `로그인`)·햄버거이고, 로그인했으면 햄버거 왼쪽에 알림 아이콘이
 * 붙는다(`/notifications` 로 간다). 목록 탭은 화면 아래 하단 내비게이션(`MobileBottomNav`)이 맡는다.
 * 데스크톱 우측에 있던 `공고 등록`·`마이페이지`·`로그아웃` 은 햄버거 메뉴 안으로 들어간다.
 * 로그인하지 않았으면 `로그인` 도 메뉴 안에 있다.
 */
export function MobileSiteHeader({
  pathname,
  signedIn,
  register,
  myPageHref,
  adminOrigin,
  showBiz,
}: MobileSiteHeaderProps) {
  const [open, setOpen] = useState(false);
  // 메뉴는 누르면 닫히며 사라지므로 광고 문의 모달은 메뉴 밖, 여기서 띄운다.
  const [adInquiryOpen, setAdInquiryOpen] = useState(false);

  return (
    <div className="md:hidden">
      <TopRow signedIn={signedIn}>
        {/* 로그인했을 때만. 로그인하지 않았으면 이 자리에 `앱 다운로드`(또는 `로그인`) 가 있다(`TopRow`). */}
        {signedIn ? <NotificationBellLink active={pathname === '/notifications'} /> : null}
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

      {open ? (
        <MobileMenu
          signedIn={signedIn}
          register={register}
          myPageHref={myPageHref}
          adminOrigin={adminOrigin}
          showBiz={showBiz}
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
    <div className="flex h-14 items-center justify-between px-5">
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
  /**
   * 다른 도메인(어드민, 비즈 오공고)이면 `Link` 가 아니라 `a` 로 그리고, 누르면 이것을 부른다 — 웹 로그인을 들고
   * 간다(`adminHandoff`, `bizHandoff`).
   */
  external?: (event: MouseEvent<HTMLAnchorElement>) => void;
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
  register,
  myPageHref,
  adminOrigin,
  showBiz,
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
  if (showBiz) {
    account.push({
      label: '비즈 오공고',
      href: bizUrl(BIZ_DASHBOARD_PATH),
      external: onBizLinkClick(BIZ_DASHBOARD_PATH, onClose),
    });
  }
  if (adminOrigin) {
    account.push({ label: '어드민', href: adminOrigin, external: onAdminLinkClick(adminOrigin) });
  }

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
        <MenuSection title="공고" links={postings} onNavigate={onClose}>
          {/* 데스크톱 헤더의 `취준 고민` 오른쪽 항목과 같은 플래그다. 모바일은 정보 묶음인 `공고` 에 둔다. 하단 탭은 다섯 칸이 디자인이라 더하지 않는다. */}
          <ReportEntry>
            <li>
              <Link
                href="/reports"
                onClick={onClose}
                className="flex h-[58px] items-center text-base text-gray-900"
              >
                <ReportNavLabel>산업 리포트</ReportNavLabel>
              </Link>
            </li>
          </ReportEntry>
        </MenuSection>
        {/* 오공고 커뮤니티는 데스크톱에서 헤더 맨 위 띠의 알림 아이콘 왼쪽에 있다. 모바일 윗줄은 로고·앱 다운로드·알림·햄버거로
            차 있다. 취준 고민은 하단 내비게이션에도 있다. */}
        <MenuSection
          title="커뮤니티"
          links={[
            { label: '취준 고민', href: '/concerns' },
            { label: '오공고 커뮤니티', href: '/community' },
          ]}
          onNavigate={onClose}
        />
        <MenuSection
          title="기업 서비스"
          links={[
            {
              label: '공고 등록하기',
              href: register.href,
              external: register.onClick ?? onClose,
            },
          ]}
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
              <a href={href} onClick={external} className={itemClass}>
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
