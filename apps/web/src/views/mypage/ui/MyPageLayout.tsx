'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import {
  type MyAccountResponse,
  type SuccessResponseMyAccountResponse,
  getMyAccount,
} from '@ogonggo/api';
import { isSignedIn } from '@/shared/api/authTokens';
import { MyPageSidebar, type MyPageMenuItem } from '@/widgets/mypage-sidebar';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; account: MyAccountResponse }
  | { kind: 'error' };

export interface MyPageLayoutProps {
  /** 사이드바에 그릴 메뉴. 기업 회원 마이페이지(v5)는 자기 목록을 넘긴다. */
  menuItems: readonly MyPageMenuItem[];
  children: ReactNode;
}

/**
 * `/mypage` 다섯 화면이 공유하는 껍데기(PRD 1 절). 좌측 사이드바 + 우측 본문이고, 본문은
 * 라우트가 넘긴다.
 *
 * 계정 읽기와 로그인 가드는 `views/signup/ui/CareerSignUpPage.tsx` 와 같은 방식이다 — 토큰이
 * 브라우저 저장소에만 있어 서버에서는 로그인 여부를 알 수 없으므로 첫 렌더 뒤에 본다.
 * 로그인하지 않았으면 `/login` 으로 보내고, 돌아올 곳으로 지금 경로를 실어 준다.
 * 일반 회원 화면이라 기업·관리자 계정은 홈으로 보낸다 — 커리어 정보는 일반 회원의 `profile`
 * 이고 기업 계정에는 없다. v5 가 이 자리를 역할 분기로 바꾼다.
 *
 * 본문(`children`) 은 계정을 기다리지 않고 바로 그린다. 계정은 사이드바의 프로필 카드만
 * 쓰고, 그 카드는 값이 올 때까지 회색 막대로 자리를 잡는다.
 */
export function MyPageLayout({ menuItems, children }: MyPageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>({ kind: 'loading' });

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
        if (body.data.role !== 'USER') {
          router.replace('/');
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
  }, [router]);

  const profile = state.kind === 'ready' ? (state.account.profile ?? {}) : undefined;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-950">마이페이지</h1>
      <div className="mt-6 flex gap-10">
        <MyPageSidebar
          menuItems={menuItems}
          name={profile?.name}
          profileImageUrl={profile?.profileImageUrl}
          details={[
            { label: '희망직무', value: profile?.wishJob },
            { label: '희망기업', value: profile?.wishCompany },
          ]}
          editHref="/mypage/profile"
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
