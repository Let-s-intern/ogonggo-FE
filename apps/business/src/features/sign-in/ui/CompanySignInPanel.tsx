'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HttpError, signInCompany, type SuccessResponseAuthTokenResponse } from '@ogonggo/api';
import { clearTokens, saveTokens } from '@/shared/api/authTokens';
import { readMyAccount } from '@/shared/api/useMyAccount';
import { SignInForm } from './SignInForm';

export interface CompanySignInPanelProps {
  /** 로그인 뒤 돌아갈 화면. 이미 걸러진 값이다(`shared/lib/returnPath.ts`). 없으면 기업 마이페이지다. */
  returnPath: string | null;
}

export const NOT_COMPANY_MESSAGE = '기업회원 계정이 아니에요. 기업 계정으로 로그인해 주세요.';

/**
 * 기업회원 로그인. web 로그인 화면의 기업 탭(`apps/web/src/features/sign-in/ui/CompanySignInPanel.tsx`)과 같은
 * 오공고 로그인 API(`signInCompany`)를 부르고, 토큰은 비즈니스 출처 저장소에 둔다(PRD `비즈니스 서브도메인`).
 *
 * 토큰을 받은 뒤 내 계정을 한 번 읽어 역할을 본다. 기업이 아니면 토큰을 지우고 막는다 — 비즈니스의 모든 화면이
 * 기업 계정을 전제로 한다. 계정을 읽지 못하면(서버 사정) 막지 않고 들여보낸다. 마이페이지 껍데기가 다시 본다.
 */
export function CompanySignInPanel({ returnPath }: CompanySignInPanelProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (credentials: { email: string; password: string }) => {
    setPending(true);
    setError(null);
    try {
      // 생성 타입은 `{ data, status }` 로 감싼 모양이지만 httpClient 는 본문을 그대로 돌려준다. web 과 같다.
      const body = (await signInCompany(
        credentials,
      )) as unknown as SuccessResponseAuthTokenResponse;
      if (!body.data) {
        throw new Error('기업 로그인 응답에 토큰이 없습니다.');
      }
      saveTokens(body.data);
      const account = await readMyAccount().catch(() => null);
      if (account && account.role !== 'COMPANY') {
        clearTokens();
        setError(NOT_COMPANY_MESSAGE);
        setPending(false);
        return;
      }
      // 성공하면 화면을 떠나므로 pending 을 풀지 않는다.
      router.replace(returnPath ?? '/mypage/company');
    } catch (caught) {
      setError(companySignInErrorMessage(caught));
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col">
      <p className="pb-4 text-sm text-gray-500">기업 계정으로 로그인합니다.</p>
      <SignInForm
        onSubmit={handleSubmit}
        pending={pending}
        error={error}
        emailLabel="업무용 이메일"
      />
      <div className="flex justify-center gap-1 pt-12 text-sm text-gray-500">
        아직 기업회원이 아니신가요?
        <Link href="/signup" className="font-medium text-gray-900 hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}

/** web 과 같은 문구다. 401 은 틀린 계정, 403 은 정지·탈퇴다. */
function companySignInErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 401) {
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }
    if (error.status === 403) {
      return '이용이 정지되었거나 탈퇴한 계정입니다. 고객센터로 문의해 주세요.';
    }
  }
  return '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
