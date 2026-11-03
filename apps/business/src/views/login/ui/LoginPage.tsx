'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { CompanySignInPanel } from '@/features/sign-in';

export interface LoginPageProps {
  /** `?redirect=` 를 거른 값. 같은 사이트의 경로가 아니면 `null` 이다. */
  returnPath: string | null;
}

/**
 * 비즈니스 로그인 화면. web 로그인 화면(`apps/web/src/views/login/ui/LoginPage.tsx`)의 기업 탭만 옮겨 탭이 없다.
 * 이미 기업 계정으로 로그인했으면 돌아갈 화면(없으면 기업 마이페이지)으로 보낸다.
 */
export function LoginPage({ returnPath }: LoginPageProps) {
  const router = useRouter();
  const accountState = useMyAccount();
  const alreadyCompany = accountState.kind === 'ready' && accountState.account.role === 'COMPANY';

  useEffect(() => {
    if (alreadyCompany) {
      router.replace(returnPath ?? '/mypage/company');
    }
  }, [alreadyCompany, router, returnPath]);

  return (
    <main className="flex justify-center bg-white px-5 pt-16 pb-24 md:pt-28 md:pb-32">
      <div className="flex w-full max-w-104 flex-col">
        <h1 className="pb-2 text-center text-xl font-bold text-gray-900">기업회원 로그인</h1>
        <p className="pb-10 text-center text-sm text-gray-500">
          로그인하면 공고 관리와 광고 신청 내역·성과 리포트를 볼 수 있어요.
        </p>
        <CompanySignInPanel returnPath={returnPath} />
      </div>
    </main>
  );
}
