'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { Button, MenuItem, cn } from '@ogonggo/ui';
import { isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { Logo } from '@/shared/ui/Logo';
import { AccountMenu } from './AccountMenu';
import { NAV_ITEMS, isNavActive } from './navItems';

/**
 * 비즈니스 앱 헤더. 피그마가 없어 web 헤더(`apps/web/src/widgets/site-header/ui/SiteHeader.tsx`)의 아래 줄과
 * 같은 모양으로 만든다 — 높이 56px, `MenuItem` 밑줄 메뉴, 우측 글자 메뉴, 흰 바탕에 아래 회색 선.
 *
 * 왼쪽은 오공고 로고와 `비즈니스`, 그 옆에 `광고 안내` · `신청 가능 일정` · `광고 신청`. 오른쪽은 토큰이 없으면
 * `로그인`, 있으면 `{이름} 님` 드롭다운이다. 이름은 기업 계정의 담당자 이름이다. 토큰이 브라우저 저장소에만
 * 있어 서버 렌더와 첫 하이드레이션은 `로그인` 으로 그리고 그 직후 바꾼다.
 *
 * 모바일(`md` 미만)은 로고 줄 아래에 메뉴 줄을 하나 더 둔다. 메뉴가 셋뿐이라 햄버거를 두지 않는다.
 */
export function BusinessHeader() {
  const pathname = usePathname();
  const signedIn = useSyncExternalStore(subscribeTokens, isSignedIn, () => false);
  const accountState = useMyAccount();
  const accountName =
    accountState.kind === 'ready' ? accountState.account.companyProfile?.managerName : undefined;
  const myPageActive = pathname.startsWith('/mypage');

  const nav = (className: string) => (
    <nav aria-label="비즈니스 메뉴" className={className}>
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isNavActive(href, pathname);
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
  );

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-page-padded items-stretch justify-between px-5 whitespace-nowrap">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="오늘의 공고 비즈니스 홈" className="flex items-center gap-2">
            <Logo className="h-[25px] w-[52px] text-blue-500" />
            <span className="text-base font-bold text-gray-900">비즈니스</span>
          </Link>
          {nav('hidden items-stretch gap-4 md:flex lg:gap-6')}
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
          {signedIn ? (
            <AccountMenu name={accountName} myPageActive={myPageActive} />
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </div>
      </div>
      {nav('mx-auto flex h-11 max-w-page-padded items-stretch gap-4 overflow-x-auto px-5 whitespace-nowrap md:hidden')}
    </header>
  );
}
