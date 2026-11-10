'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import {
  listMyAdvertisementContracts,
  type SuccessResponsePageResponseMyAdvertisementContractSummaryResponse,
} from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { isSignedIn } from '@/shared/api/authTokens';
import { SiteHeader } from '@/shared/ui/SiteHeader';
import { fetchCompanyPostTotals } from '@/widgets/company-posts';
import { MY_AD_CONTRACTS_HREF } from '@/widgets/my-ad-contracts/model';
import { myPageMobileHeaderOf } from '../model/menu';
import { CompanyConsoleNav } from './CompanyConsoleNav';

export interface MemberShellProps {
  children: ReactNode;
  /**
   * 본문을 가운데 폭·여백 안에 넣는다. 기업 회원 화면(대시보드·목록·폼)은 넣고, 로그인한 채로 여는 공개 화면
   * (광고 안내·광고 신청)은 자기 폭과 배경이 있어 넣지 않는다.
   */
  contained?: boolean;
}

/**
 * 기업 회원으로 로그인했을 때의 틀. 전체 폭의 흰 헤더(`SiteHeader` 의 `layout="member"`) 아래 왼쪽 고정 메뉴와
 * 본문이다. 헤더의 로고 칸이 메뉴와 같은 폭·바탕이라 메뉴가 위까지 이어져 보인다.
 *
 * 기업 회원 화면(`CompanyMyPageLayout`)과, 로그인한 채로 여는 공개 화면(`app/(site)/SiteFrame.tsx`)이 같이 쓴다 —
 * 광고 안내·광고 신청을 눌러도 메뉴가 사라지지 않는다(2026-11-10 사용자). 푸터는 두지 않는다.
 *
 * 모바일(md 미만)은 왼쪽 메뉴 대신 헤더 아래에 가로 메뉴를 둔다. 작성·수정 화면은 메뉴 대신 `< 제목` 머리를 단다.
 */
export function MemberShell({ children, contained = true }: MemberShellProps) {
  const pathname = usePathname();

  /**
   * 메뉴 옆 건수(`채용공고` · `부트캠프` · `광고 신청 내역`). 경로가 바뀔 때마다 다시 센다 — 공고를 저장하거나
   * 광고를 신청하고 돌아오면 늘어 있어야 한다. 실패한 것은 숫자 없이 이름만 둔다.
   */
  const [postTotals, setPostTotals] = useState<Record<string, number | undefined>>({});
  const [adTotal, setAdTotal] = useState<number | undefined>(undefined);
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
    // 한 건만 불러 전체 건수만 읽는다(`GET /api/v1/users/me/advertisement-contracts`).
    (
      listMyAdvertisementContracts({
        page: 1,
        size: 1,
      }) as unknown as Promise<SuccessResponsePageResponseMyAdvertisementContractSummaryResponse>
    )
      .then((response) => {
        if (active) setAdTotal(response.data?.pageInfo.totalElements);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [pathname]);
  const counts = { ...postTotals, [MY_AD_CONTRACTS_HREF]: adTotal };

  const mobileHeader = myPageMobileHeaderOf(pathname);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader layout="member" />

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-gray-50 md:block">
          <div className="sticky top-16">
            <CompanyConsoleNav variant="side" counts={counts} />
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
          <main
            className={cn(
              'min-w-0 flex-1',
              contained && 'mx-auto w-full max-w-[1120px] px-5 py-6 md:px-10 md:py-10',
            )}
          >
            {/* 경로가 바뀌면 다시 그려 떠오르며 나타난다. `?page=` 만 바뀔 때는 그대로 둔다. */}
            <div
              key={pathname}
              className="motion-safe:animate-[ogonggo-biz-page-in_0.35s_cubic-bezier(0.22,1,0.36,1)]"
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
