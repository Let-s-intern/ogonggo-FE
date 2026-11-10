'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { isSignedIn } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { loginHref } from '@/shared/lib/returnPath';
import { MemberShell } from './MemberShell';

export interface CompanyMyPageLayoutProps {
  children: ReactNode;
}

/**
 * 기업 회원 화면(`/mypage/company` 아래)의 틀. 모양은 `MemberShell`(왼쪽 메뉴 + 본문)이고, 여기서는
 * 로그인·역할 가드만 더한다.
 *
 * 토큰이 브라우저 저장소에만 있어 로그인 여부와 역할은 첫 렌더 뒤에 본다. 로그인하지 않았거나 기업 회원이 아니면
 * `/login?redirect=<지금 경로>` 로 보낸다. 로그인 화면이 기업 회원이 아닌 계정에게 안내한다
 * (`widgets/sign-in/LoginPage.tsx`). 본문은 계정을 기다리지 않고 바로 그린다.
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

  return (
    <MemberShell>
      {account.kind === 'error' ? (
        <p role="alert" className="text-sm text-error">
          내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : (
        children
      )}
    </MemberShell>
  );
}
