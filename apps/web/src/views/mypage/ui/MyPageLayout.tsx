'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import {
  type MyAccountResponse,
  type SuccessResponseMyAccountResponse,
  getMyAccount,
} from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { isSignedIn } from '@/shared/api/authTokens';
import {
  type MyPageAudience,
  MyPageSidebar,
  isMyPageIndex,
  myPageAudienceOf,
  myPageHomeFor,
  myPageIndexFor,
  myPageMenuFor,
  myPageMobileHeaderOf,
} from '@/widgets/mypage-sidebar';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; account: MyAccountResponse }
  | { kind: 'error' };

export interface MyPageLayoutProps {
  children: ReactNode;
}

/**
 * `/mypage` 아래 모든 화면이 공유하는 껍데기(v4 PRD 1 절, v5 PRD 1 절). 좌측 사이드바 +
 * 우측 본문이고, 본문은 라우트가 넘긴다.
 *
 * **일반 회원과 기업 회원이 이 껍데기 하나를 나눠 쓴다.** 메뉴 목록을 라우트가 넘기지 않고
 * 여기서 경로로 고르는 이유는 Next 의 레이아웃이 경로를 따라 겹치기 때문이다 —
 * `/mypage/company` 에 레이아웃을 하나 더 두면 일반 회원 껍데기 안에 기업 껍데기가 들어가
 * 사이드바가 둘이 된다. 판정은 `myPageAudienceOf` 하나에 모여 있다.
 *
 * 계정 읽기와 로그인 가드는 `views/signup/ui/CareerSignUpPage.tsx` 와 같은 방식이다 — 토큰이
 * 브라우저 저장소에만 있어 서버에서는 로그인 여부를 알 수 없으므로 첫 렌더 뒤에 본다.
 * 로그인하지 않았으면 `/login` 으로 보내고, 돌아올 곳으로 지금 경로를 실어 준다.
 * 역할이 경로와 어긋나면 자기 마이페이지로 보낸다 — 일반 회원이 기업 화면에 들어오면 일반
 * 마이페이지로, 기업 회원이 일반 화면에 들어오면 기업 마이페이지로. `/mypage` 는 일반 회원의
 * 첫 화면으로 보내므로 기업 계정은 거기서 한 번 더 튕겨 기업 마이페이지에 닿는다.
 * **관리자는 일반 회원과 같게 다룬다**(`prd-mypage-admin-access.md`). 관리자도 스크랩과
 * 모집글을 쌓으므로 볼 자리가 있어야 하고, 관리자 계정으로 화면을 확인할 수 없는 것이
 * 개발을 막고 있었다. 기업 마이페이지만은 열지 않는다.
 *
 * 모바일(`md` 미만)은 화면이 둘로 갈린다(`docs/asset/v10 mobile/`). 첫 화면(`/mypage`,
 * `/mypage/company`)은 사이드바가 곧 메뉴 화면이고, 하위 화면은 사이드바를 숨기고 `< 제목`
 * 머리를 단다. 사이트 헤더도 하위 화면에서는 숨는다(`SiteHeader`) — 시안의 하위 화면은 그
 * 머리 한 줄뿐이다.
 *
 * 본문(`children`) 은 계정을 기다리지 않고 바로 그린다. 계정은 사이드바의 프로필 카드만
 * 쓰고, 그 카드는 값이 올 때까지 회색 막대로 자리를 잡는다.
 */
export function MyPageLayout({ children }: MyPageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const audience = myPageAudienceOf(pathname);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [router, pathname]);

  useEffect(() => {
    if (!isSignedIn()) {
      return;
    }
    let active = true;
    // 생성 타입은 `{ data, status }` 로 감싼 모양이지만 httpClient 는 본문을 그대로 돌려준다.
    (getMyAccount() as unknown as Promise<SuccessResponseMyAccountResponse>)
      .then((body) => {
        if (!active) {
          return;
        }
        if (!body.data) {
          setState({ kind: 'error' });
          return;
        }
        const { role } = body.data;
        // 기업 회원이면 기업 마이페이지, 그 밖에는 일반 마이페이지가 자기 자리다. 역할을
        // 나열하지 않고 기업만 가려내는 이유는 관리자도 오공고 회원이어서다 — 스크랩과
        // 모집글 기록이 일반 회원과 같은 자리에 쌓이고, 관리자 전용 마이페이지는 없다.
        // 기업 마이페이지만은 열지 않는다. 관리자는 기업 회원이 아니다.
        const home: MyPageAudience = role === 'COMPANY' ? 'COMPANY' : 'USER';
        if (home !== audience) {
          // 자기 마이페이지로 보낸다. 홈으로 보내면 자기 마이페이지가 어디인지 알려 주지
          // 않은 채 쫓아내는 것이 된다.
          router.replace(isMyPageIndex(pathname) ? myPageIndexFor(home) : myPageHomeFor(home));
          return;
        }
        setState({ kind: 'ready', account: body.data });
      })
      .catch(() => {
        // 401 이고 재발급도 실패했으면 `shared/api/reissue.ts` 가 이미 로그인 화면으로 보냈다.
        if (active) {
          setState({ kind: 'error' });
        }
      });
    return () => {
      active = false;
    };
  }, [router, audience]);

  const account = state.kind === 'ready' ? state.account : undefined;
  const profile = account ? (account.profile ?? {}) : undefined;
  /** 기업 계정의 이름 자리는 담당자 이름이다. 목업 카드의 `오공고 님` 이 그 값이다. */
  const companyProfile = account?.companyProfile;
  const isCompany = audience === 'COMPANY';
  const isIndex = isMyPageIndex(pathname);
  const mobileHeader = myPageMobileHeaderOf(pathname);

  return (
    <main className={cn('mx-auto w-full max-w-6xl px-4 md:py-12', isIndex ? 'py-6' : 'pb-12')}>
      <h1 className={cn('text-2xl font-bold text-gray-950', !isIndex && 'hidden md:block')}>
        마이페이지
      </h1>
      {mobileHeader ? (
        <div className="-mx-4 mb-4 flex h-14 items-center gap-2 border-b border-gray-200 px-4 md:hidden">
          <Link href={mobileHeader.back} aria-label="뒤로" className="-ml-1 p-1 text-gray-900">
            <span aria-hidden="true" className="icon-[lucide--chevron-left] block h-6 w-6" />
          </Link>
          <p className="text-lg font-bold text-gray-950">{mobileHeader.title}</p>
        </div>
      ) : null}
      <div className="flex flex-col md:mt-6 md:flex-row md:gap-10">
        <div className={cn('mt-6 md:mt-0', !isIndex && 'hidden md:block')}>
          <MyPageSidebar
            menuItems={myPageMenuFor(audience)}
            name={isCompany ? companyProfile?.managerName : profile?.name}
            profileImageUrl={isCompany ? undefined : profile?.profileImageUrl}
            details={
              isCompany
                ? [{ label: '기업/기관 명', value: companyProfile?.organizationName }]
                : [
                    { label: '희망직무', value: profile?.wishJob },
                    { label: '희망기업', value: profile?.wishCompany },
                  ]
            }
            editHref={isCompany ? '/mypage/company/profile' : '/mypage/profile'}
          />
        </div>
        <div className={cn('min-w-0 flex-1', isIndex && 'hidden md:block')}>
          {state.kind === 'error' ? (
            <p role="alert" className="text-sm text-error">
              내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          ) : (
            children
          )}
        </div>
      </div>
    </main>
  );
}
