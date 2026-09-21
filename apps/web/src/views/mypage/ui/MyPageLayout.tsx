'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import {
  type MyAccountResponse,
  type SuccessResponseMyAccountResponse,
  getMyAccount,
} from '@ogonggo/api';
import { isSignedIn } from '@/shared/api/authTokens';
import {
  MyPageSidebar,
  myPageAudienceOf,
  myPageHomeFor,
  myPageMenuFor,
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
        if (role !== audience) {
          // 일반 회원과 기업 회원은 서로의 마이페이지로 보낸다. 홈으로 보내면 자기 마이페이지가
          // 어디인지 알려 주지 않은 채 쫓아내는 것이 된다. 관리자는 `apps/admin` 을 쓰므로
          // 여기에 자기 자리가 없어 홈으로 보낸다.
          router.replace(role === 'USER' || role === 'COMPANY' ? myPageHomeFor(role) : '/');
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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-950">마이페이지</h1>
      <div className="mt-6 flex gap-10">
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
        <div className="min-w-0 flex-1">
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
