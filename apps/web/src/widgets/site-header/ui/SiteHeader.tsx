'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { Button, MenuItem, cn } from '@ogonggo/ui';
import { isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { NotificationBell } from '@/features/notification-inbox';
import { PushConsentButton } from '@/features/push-notification';
import { COMPANY_JOB_REGISTER_HREF, companyJobRegisterHref } from '@/shared/lib/companyJobRegister';
import { myPageHomeFor, myPageIndexFor, myPageMobileHeaderOf } from '@/widgets/mypage-sidebar';
import { AccountMenu } from './AccountMenu';
import { MobileSiteHeader } from './MobileSiteHeader';
import { Logo } from '@/shared/ui/Logo';
import { NAV_ITEMS } from './navItems';
import { ServiceLogoToggle } from './ServiceLogoToggle';

/**
 * 어드민 콘솔 주소(`apps/admin`). 웹과 다른 도메인이라 경로가 아니라 오리진을 통째로 받는다.
 *
 * 비어 있으면 `어드민` 항목을 그리지 않는다. `undefined/` 로 가는 링크를 두면 누르는 순간 이 도메인의
 * 404 가 떠서 원인이 주소 설정이라는 것이 보이지 않는다. 값을 넣는 방법은 `.env.example` 에 적었다.
 */
const ADMIN_ORIGIN = process.env.NEXT_PUBLIC_ADMIN_ORIGIN;

/**
 * `home.png`·`교육부트캠프.png`의 상단 헤더. 현재 경로에 밑줄이 붙어야 해서 `usePathname`을
 * 쓰는 클라이언트 컴포넌트다.
 *
 * 데스크톱은 두 줄이다. 맨 위 얇은 띠에 서비스 토글 `[렛츠커리어 | 오늘의 공고]`(`ServiceLogoToggle`)가
 * 있고, 그 아래 줄에 오공고 심볼 로고(`docs/asset/v3 변경사항/오공고 로고.svg`, 52x25)와 메뉴, 우측 링크가
 * 있다. 글자가 없는 마크라 로고 링크의 이름은 `aria-label`로 붙인다.
 *
 * 토글은 렛츠커리어 마크를 누르면 렛츠커리어 웹으로 로그인을 이어 가고, 로고는 홈이다. 로그인했으면 이 띠의
 * 오른쪽 끝에 알림 아이콘이 있고, 누르면 그 아래로 알림 패널이 열린다(`NotificationBell`). 이 기기에서 푸시를
 * 아직 켜지 않았으면 아이콘 왼쪽에 `푸시 알림 받기` 가 붙고, 켜면 사라진다(`PushConsentButton`).
 *
 * 우측은 `공고 등록`·`공고 달력`, 그리고 로그인했으면 `[사람] {이름} 님` 이다.
 * `공고 등록` 이 가는 곳은 역할마다 다르다 — 아래 `registerHref` 주석에 적었다.
 * `{이름} 님` 은 `마이페이지`·`로그아웃` 을 펼치는 드롭다운이고, 관리자에게는 `어드민` 이
 * 더해진다(`AccountMenu`, `showAdmin`). `로그아웃` 은 마이페이지의 `개인 정보`·`기업/기관 정보`
 * 화면 아래와 모바일 햄버거 메뉴에도 있다.
 *
 * 맨 오른쪽은 토큰 유무로 갈린다. 없으면 "로그인"(`/login`), 있으면 "{이름} 님". 토큰이 브라우저 저장소에만
 * 있어 서버는 알 수 없으므로 서버 렌더와 첫 하이드레이션은 "로그인" 으로 그리고, 그 직후 저장소를 읽어
 * 바꾼다(`useSyncExternalStore` 의 서버 스냅샷).
 *
 * 좌측 메뉴는 `MenuItem`이 그린다(`docs/asset/v3-1/menu/`). 밑줄은 그 컴포넌트의 `current`
 * 상태고, 36px 상자의 맨 아래에 있어 전보다 7px 내려온다 — 목업의 밑줄도 글자에서 그만큼
 * 떨어져 있다. 글자 크기만 `text-sm`으로 덮어쓰는 이유는
 * `.claude/tasks/memos/결정-menuitem-글자크기-2026-09-21.md`에 적었다.
 *
 * 모바일(`md` 미만)은 이 줄을 숨기고 `MobileSiteHeader` 가 그린다 — 두 줄 헤더와 햄버거 메뉴
 * (`docs/asset/v9 mobile/`). 경로와 역할로 정하는 값(`registerHref` 등)은 여기서 한 번만 계산해
 * 넘긴다.
 *
 * 우측 메뉴의 활성 표시는 좌측과 다르다. 좌측은 밑줄인데, 우측은 목업
 * (`docs/asset/공고달력.png`)의 `공고 달력` 화면에서도 밑줄이 없다 — 헤더 높이를 꽉 채우는
 * 좌측 탭과 달리 우측은 가운데 정렬된 짧은 줄이라 밑줄이 붙을 자리가 없다. 그래서 글자색만
 * 진해진다.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const calendarActive = pathname.startsWith('/calendar');
  const signedIn = useSyncExternalStore(subscribeTokens, isSignedIn, () => false);
  const accountState = useMyAccount();
  const role = accountState.kind === 'ready' ? accountState.account.role : undefined;

  /*
   * 기업 회원이면 공고 등록 폼으로, 그 밖에는(로그아웃, 일반 회원) 기업 회원 **로그인**으로
   * 보낸다. `ForBusinessBanner` 의 같은 버튼과 같은 규칙이다(`shared/lib/companyJobRegister.ts`).
   * 기업 계정이 없는 사람은 로그인 화면의 `회원가입` 으로 간다.
   */
  const registerHref = companyJobRegisterHref(role);
  const registerActive = pathname.startsWith(COMPANY_JOB_REGISTER_HREF);

  /*
   * 마이페이지는 역할마다 첫 화면이 다르다(`myPageHomeFor`). 역할을 아직 모르는 동안에는
   * 일반 회원 쪽으로 보내 둔다 — 기업 계정이 그리 가도 `MyPageLayout` 의 역할 가드가 기업
   * 마이페이지로 다시 보낸다. 역할이 올 때까지 링크를 감추면 헤더에서 항목이 늦게 나타난다.
   */
  const myPageHref = myPageHomeFor(role === 'COMPANY' ? 'COMPANY' : 'USER');
  const myPageActive = pathname.startsWith('/mypage');
  /*
   * 모바일은 마이페이지 첫 화면(메뉴)으로 보낸다. `< 제목` 머리가 붙는 화면에서는 이 헤더가
   * 숨고 그 머리가 대신한다(`docs/asset/v10 mobile/`). 일반 회원의 탭 화면에는 머리가 없어
   * 헤더가 그대로 보인다.
   */
  const myPageMobileHref = myPageIndexFor(role === 'COMPANY' ? 'COMPANY' : 'USER');
  const hiddenOnMobile = myPageMobileHeaderOf(pathname) !== undefined;

  /*
   * 관리자에게만 어드민 콘솔로 가는 항목을 보인다. 역할을 아직 모르는 동안에는 그리지 않는다 —
   * 마이페이지처럼 한쪽으로 찍어 둘 수 없다. 마이페이지는 틀려도 `MyPageLayout` 의 역할 가드가
   * 되돌려 주지만, 여기서 찍는 쪽이 `ADMIN` 이면 일반·기업 회원 모두에게 관리자 입구가 잠깐
   * 보이고 그것을 되돌려 줄 가드가 헤더에는 없다. 그래서 늦게 나타나는 쪽을 택한다.
   */
  const showAdmin = role === 'ADMIN' && Boolean(ADMIN_ORIGIN);

  /** `{이름} 님` 의 이름. 마이페이지 껍데기(`MyPageLayout`)와 같은 규칙이다. */
  const account = accountState.kind === 'ready' ? accountState.account : undefined;
  const accountName =
    role === 'COMPANY' ? account?.companyProfile?.managerName : account?.profile?.name;

  /** 데스크톱의 두 드롭다운(알림 패널, `{이름} 님` 메뉴) 중 열린 것. 하나가 열리면 다른 하나는 닫힌다. */
  const [openMenu, setOpenMenu] = useState<'notifications' | 'account' | null>(null);
  const toggleMenu = (menu: 'notifications' | 'account') => (open: boolean) =>
    setOpenMenu((current) => (open ? menu : current === menu ? null : current));

  return (
    <header
      className={cn('border-b border-gray-200 bg-white', hiddenOnMobile && 'hidden md:block')}
    >
      <MobileSiteHeader
        pathname={pathname}
        signedIn={signedIn}
        registerHref={registerHref}
        myPageHref={myPageMobileHref}
        adminOrigin={showAdmin ? ADMIN_ORIGIN : undefined}
      />
      {/* 탭이 넷이 되어 md 경계(768px)의 여유가 줄었다. 이름이 5자 이상이거나 관리자 계정이면 768px 에서 탭과
          우측 글자가 음절 사이에서 줄바꿈되므로(실측) `whitespace-nowrap` 으로 막고, 탭 사이는 lg 미만에서만
          16px 로 좁힌다. */}
      {/* 화면 맨 위에 붙어 보여 위에만 8px 를 더 둔다(`pt-2`). 아래 로고 줄과의 간격은 그대로다.
          아래의 아주 연한 가로선(`gray-100`)은 화면 끝까지 닿아야 해서 폭을 제한한 안쪽 상자가 아니라
          이 바깥 상자에 둔다. */}
      <div className="hidden border-b border-gray-100 md:block">
        <div className="mx-auto flex h-10 max-w-page-padded items-center justify-between px-5 pt-2 whitespace-nowrap">
          <ServiceLogoToggle size="desktop" />
          {/* 알림 아이콘은 이 띠의 오른쪽 끝이다(사용자 결정). 아래 메뉴 줄은 768px 에서 여유가 없다. */}
          {signedIn ? (
            <div className="flex items-center gap-3">
              <PushConsentButton />
              <NotificationBell
                open={openMenu === 'notifications'}
                onOpenChange={toggleMenu('notifications')}
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="mx-auto hidden h-14 max-w-page-padded items-stretch justify-between px-5 whitespace-nowrap md:flex">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="오늘의 공고 홈">
            <Logo className="h-[25px] w-[52px] text-blue-500" />
          </Link>
          <nav className="flex items-stretch gap-4 lg:gap-6">
            {NAV_ITEMS.map(({ href, label, matches }) => {
              const active = matches(pathname);
              return (
                <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
                  <MenuItem
                    state={active ? 'current' : 'default'}
                    className={cn('text-sm', active && 'font-semibold')}
                  >
                    {label}
                  </MenuItem>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
          <Link
            href={registerHref}
            aria-current={registerActive ? 'page' : undefined}
            className={cn(
              'transition-colors hover:text-gray-900',
              registerActive && 'font-semibold text-gray-900',
            )}
          >
            공고 등록
          </Link>
          <Link
            href="/calendar"
            aria-current={calendarActive ? 'page' : undefined}
            className={cn(
              'transition-colors hover:text-gray-900',
              calendarActive && 'font-semibold text-gray-900',
            )}
          >
            공고 달력
          </Link>
          {signedIn ? (
            <AccountMenu
              name={accountName}
              myPageHref={myPageHref}
              myPageActive={myPageActive}
              adminOrigin={showAdmin ? ADMIN_ORIGIN : undefined}
              open={openMenu === 'account'}
              onOpenChange={toggleMenu('account')}
            />
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
