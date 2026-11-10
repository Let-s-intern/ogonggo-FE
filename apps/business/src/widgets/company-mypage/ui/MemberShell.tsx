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
import { useMyAccount } from '@/shared/api/useMyAccount';
import { useSignOut } from '@/shared/api/useSignOut';
import { LetsCareerMark } from '@/shared/ui/LetsCareerMark';
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
/**
 * 왼쪽 메뉴 맨 아래의 계정. 로고·기업명·담당자와 로그아웃이다(2026-11-10 사용자: 헤더 오른쪽 기업명을 왼쪽 아래로).
 * 기업 정보 수정은 위의 `기업/기관 정보` 메뉴다. 로고가 없으면 렛츠커리어 마크를 둔다.
 */
function AccountBlock() {
  const account = useMyAccount();
  const { signOut, pending } = useSignOut();
  const profile = account.kind === 'ready' ? account.account.companyProfile : undefined;

  return (
    <div className="border-t border-gray-200 p-3">
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
          {profile?.logoUrl ? (
            <img src={profile.logoUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <LetsCareerMark flat className="size-5 text-blue-200" />
          )}
        </span>
        {profile ? (
          <span className="min-w-0 flex-1 motion-safe:animate-[ogonggo-biz-fade-in_0.3s_ease-out]">
            <span className="block truncate text-sm font-semibold text-gray-900">
              {profile.organizationName}
            </span>
            <span className="block truncate text-xs text-gray-500">
              담당자 {profile.managerName} 님
            </span>
          </span>
        ) : (
          <span aria-hidden="true" className="flex flex-1 flex-col gap-1.5">
            <span className="h-3.5 w-24 rounded-xs bg-gray-200" />
            <span className="h-3 w-16 rounded-xs bg-gray-200" />
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => signOut()}
        disabled={pending}
        className="mt-1 flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-sm text-gray-500 transition-colors duration-200 hover:bg-gray-200/60 hover:text-gray-900 disabled:text-gray-300"
      >
        <span aria-hidden="true" className="icon-[lucide--log-out] block size-4" />
        로그아웃
      </button>
    </div>
  );
}

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
          <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col">
            <div className="flex-1 overflow-y-auto">
              <CompanyConsoleNav variant="side" counts={counts} />
            </div>
            <AccountBlock />
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
