'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { isSignedIn } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { loginHref } from '@/shared/lib/returnPath';
import { SiteHeader } from '@/shared/ui/SiteHeader';
import { fetchCompanyPostTotals } from '@/widgets/company-posts';
import { myPageMobileHeaderOf } from '../model/menu';
import { CompanyConsoleNav } from './CompanyConsoleNav';

export interface CompanyMyPageLayoutProps {
  children: ReactNode;
}

/**
 * 기업 회원 화면(`/mypage/company` 아래)의 틀. 흰 사이트 헤더를 전체 폭으로 펴고(`SiteHeader` 의 `layout="member"`), 그
 * 아래 왼쪽에 고정 메뉴를 둔다. 헤더의 로고 칸이 메뉴와 같은 폭·바탕이라 메뉴가 위까지 이어져 보인다(2026-11-10
 * 사용자: 로그인하면 헤더도 그에 맞게). 푸터는 두지 않는다.
 *
 * 토큰이 브라우저 저장소에만 있어 로그인 여부와 역할은 첫 렌더 뒤에 본다. 로그인하지 않았거나 기업 회원이 아니면
 * `/login?redirect=<지금 경로>` 로 보낸다. 로그인 화면이 기업 회원이 아닌 계정에게 안내한다
 * (`widgets/sign-in/LoginPage.tsx`). 본문은 계정을 기다리지 않고 바로 그린다.
 *
 * 모바일(md 미만)은 왼쪽 메뉴 대신 헤더 아래에 가로 메뉴를 둔다. 작성·수정 화면은 메뉴 대신 `< 제목` 머리를 단다.
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
   * 메뉴 옆 건수(`채용공고` · `부트캠프`). 경로가 바뀔 때마다 다시 센다 — 공고를 저장하고 목록으로 돌아오면
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
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader layout="member" />

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-gray-50 md:block">
          <div className="sticky top-16">
            <CompanyConsoleNav variant="side" counts={postTotals} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {mobileHeader ? (
            <div className="flex h-14 items-center gap-2 border-b border-gray-200 bg-white px-5 md:hidden">
              <Link href={mobileHeader.back} aria-label="뒤로" className="-ml-1 p-1 text-gray-900">
                <span aria-hidden="true" className="icon-[lucide--chevron-left] block h-6 w-6" />
              </Link>
              <p className="text-lg font-bold text-gray-950">{mobileHeader.title}</p>
            </div>
          ) : (
            <div className="md:hidden">
              <CompanyConsoleNav variant="bar" />
            </div>
          )}
          <main className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-6 md:px-10 md:py-10">
            {account.kind === 'error' ? (
              <p role="alert" className="text-sm text-error">
                내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
