'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { isSignedIn } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { loginHref } from '@/shared/lib/returnPath';
import { fetchCompanyPostTotals } from '@/widgets/company-posts';
import { COMPANY_MYPAGE_MENU, myPageMobileHeaderOf } from '../model/menu';
import { MyPageTabs } from './MyPageTabs';

export interface CompanyMyPageLayoutProps {
  children: ReactNode;
}

/**
 * `/mypage/company` 아래 화면의 껍데기. 가로 탭 + 본문이다. 제목은 각 화면이 단다(기업명은 사이트 헤더에 있다). 처음에는
 * web 의 `apps/web/src/views/mypage/ui/MyPageLayout.tsx` 처럼 좌측 사이드바였는데 위쪽 탭으로 바꿨다
 * (2026-11-10 사용자).
 *
 * 토큰이 브라우저 저장소에만 있어 로그인 여부와 역할은 첫 렌더 뒤에 본다. 로그인하지 않았거나 기업 회원이 아니면
 * `/login?redirect=<지금 경로>` 로 보낸다. 로그인 화면이 기업 회원이 아닌 계정에게 안내한다
 * (`widgets/sign-in/LoginPage.tsx`). web 처럼 본문은 계정을 기다리지 않고 바로 그린다.
 *
 * 모바일은 web 과 다르다. web 은 `/mypage/company` 가 메뉴 화면이지만 biz 는 그 주소를 목록으로 보낸다(PRD 6절).
 * 그래서 목록·기업 정보 화면은 탭을 본문 위에 두고, 작성·수정 화면은 탭 대신 `< 제목` 머리를 단다.
 */
export function CompanyMyPageLayout({ children }: CompanyMyPageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const account = useMyAccount();
  const notCompany = account.kind === 'ready' && account.account.role !== 'COMPANY';

  useEffect(() => {
    if (!isSignedIn() || notCompany) {
      router.replace(loginHref(pathname));
    }
  }, [router, pathname, notCompany]);

  /**
   * 탭 옆 건수(`채용공고` · `부트캠프`). 경로가 바뀔 때마다 다시 센다 — 공고를 저장하고 목록으로 돌아오면
   * 늘어 있어야 한다. 실패하면 숫자 없이 이름만 둔다.
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
            '/mypage/company/posts/jobs': totals.jobs,
            '/mypage/company/posts/bootcamps': totals.bootcamps,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [pathname]);

  const mobileHeader = myPageMobileHeaderOf(pathname);

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-page-padded px-5 md:pt-8 md:pb-12',
        mobileHeader ? 'pb-12' : 'py-6',
      )}
    >
      {mobileHeader ? (
        <div className="-mx-5 mb-4 flex h-14 items-center gap-2 border-b border-gray-200 px-5 md:hidden">
          <Link href={mobileHeader.back} aria-label="뒤로" className="-ml-1 p-1 text-gray-900">
            <span aria-hidden="true" className="icon-[lucide--chevron-left] block h-6 w-6" />
          </Link>
          <p className="text-lg font-bold text-gray-950">{mobileHeader.title}</p>
        </div>
      ) : null}
      <div className="flex flex-col gap-6 md:gap-8">
        <div className={cn(mobileHeader && 'hidden md:block')}>
          <MyPageTabs menuItems={COMPANY_MYPAGE_MENU} counts={postTotals} />
        </div>
        <div className="min-w-0">
          {account.kind === 'error' ? (
            <p role="alert" className="text-sm text-error">
              내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
