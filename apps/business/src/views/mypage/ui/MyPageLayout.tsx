'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { Button, cn } from '@ogonggo/ui';
import { useSignOut } from '@/features/sign-out';
import { isSignedIn } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { fetchCompanyPostTotals } from '@/widgets/company-posts';
import {
  COMPANY_MYPAGE_MENU,
  COMPANY_MYPAGE_ROOT,
  MyPageCompanyCard,
  MyPageSidebar,
  isMyPageIndex,
  myPageMobileHeaderOf,
} from '@/widgets/mypage-sidebar';

export interface MyPageLayoutProps {
  children: ReactNode;
}

/**
 * 기업 마이페이지 껍데기. web 의 `apps/web/src/views/mypage/ui/MyPageLayout.tsx` 에서 기업 회원 쪽만 옮겼다 —
 * 좌측 사이드바(기업 카드와 메뉴) + 우측 본문.
 *
 * 로그인하지 않았으면 `/login?redirect=<지금 경로>` 로 보낸다. 비즈니스는 기업회원만 쓰므로 기업이 아닌 계정이면
 * 본문 대신 안내와 `로그아웃` 을 보인다. web 처럼 일반 마이페이지로 보낼 곳이 비즈니스에는 없다.
 *
 * 모바일은 web 기업 마이페이지와 같다. 첫 화면(`/mypage/company`)은 사이드바가 곧 메뉴 화면이고, 하위 화면은
 * 사이드바를 숨기고 `< 제목` 머리를 단다.
 */
export function MyPageLayout({ children }: MyPageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const accountState = useMyAccount();
  const { signOut, pending } = useSignOut();

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [router, pathname]);

  /**
   * 메뉴 옆 건수(`채용공고` · `부트캠프`). 경로가 바뀔 때마다 다시 센다 — 공고를 저장하고 목록으로 돌아오면 늘어
   * 있어야 한다. 실패하면 숫자 없이 이름만 둔다. web 과 같다.
   */
  const [postTotals, setPostTotals] = useState<Record<string, number | undefined>>({});
  useEffect(() => {
    if (!isSignedIn()) {
      return;
    }
    let active = true;
    fetchCompanyPostTotals()
      .then((totals) => {
        if (active) {
          setPostTotals({
            [`${COMPANY_MYPAGE_ROOT}/posts/jobs`]: totals.jobs,
            [`${COMPANY_MYPAGE_ROOT}/posts/bootcamps`]: totals.bootcamps,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [pathname]);

  const account = accountState.kind === 'ready' ? accountState.account : undefined;
  const companyProfile = account?.companyProfile;
  const notCompany = account !== undefined && account.role !== 'COMPANY';
  const isIndex = isMyPageIndex(pathname);
  const mobileHeader = myPageMobileHeaderOf(pathname);

  return (
    <main
      className={cn(
        'mx-auto w-full max-w-page-padded px-5 md:py-12',
        mobileHeader ? 'pb-12' : 'py-6',
      )}
    >
      <h1 className={cn('text-2xl font-bold text-gray-950', mobileHeader && 'hidden md:block')}>
        마이페이지
      </h1>
      {mobileHeader ? (
        <div className="-mx-5 mb-4 flex h-14 items-center gap-2 border-b border-gray-200 px-5 md:hidden">
          <Link href={mobileHeader.back} aria-label="뒤로" className="-ml-1 p-1 text-gray-900">
            <span aria-hidden="true" className="icon-[lucide--chevron-left] block h-6 w-6" />
          </Link>
          <p className="text-lg font-bold text-gray-950">{mobileHeader.title}</p>
        </div>
      ) : null}
      {notCompany ? (
        <div role="alert" className="mt-6 flex flex-col items-start gap-4">
          <p className="text-base text-gray-700">
            비즈니스는 기업회원만 이용할 수 있어요. 기업 계정으로 다시 로그인해 주세요.
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => void signOut('/login')}
          >
            로그아웃
          </Button>
        </div>
      ) : (
        <div className="flex flex-col md:mt-6 md:flex-row md:gap-10">
          <div className={cn('mt-6 md:mt-0', !isIndex && 'hidden md:block')}>
            <MyPageSidebar
              menuItems={COMPANY_MYPAGE_MENU}
              counts={postTotals}
              card={
                <MyPageCompanyCard
                  organizationName={companyProfile?.organizationName}
                  managerName={companyProfile?.managerName}
                  logoUrl={companyProfile?.logoUrl}
                  editHref={`${COMPANY_MYPAGE_ROOT}/profile`}
                />
              }
            />
          </div>
          <div className={cn('min-w-0 flex-1', isIndex && 'hidden md:block')}>
            {accountState.kind === 'error' ? (
              <p role="alert" className="text-sm text-error">
                내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            ) : (
              children
            )}
          </div>
        </div>
      )}
    </main>
  );
}
