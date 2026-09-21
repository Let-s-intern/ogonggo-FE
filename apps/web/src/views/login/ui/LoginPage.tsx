'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tabs } from '@ogonggo/ui';
import { isSignedIn } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { BuildingIcon, UserIcon } from '@/shared/ui/icons';
import { CompanySignInPanel, UserSignInPanel } from '@/features/sign-in';

export type LoginTab = 'user' | 'company';

const TAB_ITEMS = [
  { value: 'user', label: '일반 회원', icon: <UserIcon className="size-5" /> },
  { value: 'company', label: '기업 회원', icon: <BuildingIcon className="size-5" /> },
] as const;

export interface LoginPageProps {
  initialTab: LoginTab;
  /** `?redirect=` 를 거른 값. 같은 사이트의 경로가 아니면 `null` 이다. */
  returnPath: string | null;
  /** 간편 로그인 콜백이 실패해 돌아왔을 때의 문구(`?error=` 를 옮긴 것). 있으면 일반 회원 탭에 보인다. */
  initialError: string | null;
}

/**
 * 로그인 화면(`로그인.png`). 일반 회원과 기업 회원 두 탭.
 *
 * 디자인의 GitHub·파란 불꽃(렛츠커리어 SSO 팝업) 아이콘과 "비밀번호 찾기" 는 두지 않는다(PRD "하지 않는 것").
 *
 * 탭은 주소의 `?tab=company` 와 맞춘다. 바꿀 때 `history.replaceState` 로 주소만 고친다 — 라우터로 바꾸면
 * 서버 렌더를 한 번 더 거쳐 탭이 늦게 넘어가고, 뒤로 가기에 탭 전환이 쌓인다.
 *
 * 이미 로그인한 사용자가 오면 돌아갈 화면(없으면 홈) 으로 보낸다. 토큰이 브라우저 저장소에만 있어
 * 서버에서는 알 수 없으므로 첫 렌더 뒤에 본다.
 *
 * 기업 탭(`?tab=company`) 으로 온 경우는 다르다. 이미 기업 회원일 때만 보내고, 일반 회원으로
 * 로그인한 사람에게는 기업 로그인을 그대로 보인다 — `공고 등록` 버튼이 일반 회원을 여기로 보내는데
 * (`shared/lib/companyJobRegister.ts`), 로그인했다는 이유로 홈으로 돌려보내면 기업 계정으로 바꿔
 * 들어갈 길이 없다. 기업 계정으로 로그인하면 일반 회원의 토큰을 덮어쓴다(`saveTokens`).
 */
export function LoginPage({ initialTab, returnPath, initialError }: LoginPageProps) {
  const router = useRouter();
  // 실패 문구는 일반 회원 탭(간편 로그인) 의 것이다.
  const [tab, setTab] = useState<LoginTab>(initialError ? 'user' : initialTab);

  const companyEntry = initialTab === 'company';
  const accountState = useMyAccount();
  const alreadyCompany = accountState.kind === 'ready' && accountState.account.role === 'COMPANY';

  // 들어온 순간 한 번 본다. 이 화면에서 로그인에 성공하면 그 흐름이 직접 이동한다.
  useEffect(() => {
    if (!companyEntry && isSignedIn()) {
      router.replace(returnPath ?? '/');
    }
  }, [companyEntry, router, returnPath]);

  // 기업 탭으로 왔으면 역할을 받은 뒤에 정한다. 기업 회원만 보낸다.
  useEffect(() => {
    if (companyEntry && alreadyCompany) {
      router.replace(returnPath ?? '/');
    }
  }, [companyEntry, alreadyCompany, router, returnPath]);

  // 문구는 한 번 보이면 된다. 주소에 남기면 새로고침할 때마다 다시 뜬다.
  useEffect(() => {
    if (initialError) {
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState(window.history.state, '', url);
    }
  }, [initialError]);

  const handleTabChange = (next: LoginTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'company') {
      url.searchParams.set('tab', 'company');
    } else {
      url.searchParams.delete('tab');
    }
    window.history.replaceState(window.history.state, '', url);
  };

  return (
    <main className="flex justify-center bg-white px-5 pt-16 pb-24 md:pt-28 md:pb-32">
      <div className="flex w-full max-w-104 flex-col">
        <h1 className="pb-8 text-center text-xl font-bold text-gray-900">반갑습니다!</h1>
        <Tabs
          aria-label="회원 구분"
          items={TAB_ITEMS}
          value={tab}
          onValueChange={handleTabChange}
        />
        <div role="tabpanel" className="pt-10">
          {tab === 'company' ? (
            <CompanySignInPanel returnPath={returnPath} />
          ) : (
            <UserSignInPanel returnPath={returnPath} initialError={initialError} />
          )}
        </div>
      </div>
    </main>
  );
}
