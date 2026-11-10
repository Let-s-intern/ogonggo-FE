'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HttpError, signInCompany, type SuccessResponseAuthTokenResponse } from '@ogonggo/api';
import { saveTokens } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { SignInForm } from './SignInForm';

/** 돌아갈 화면이 없을 때 로그인 뒤 가는 곳. 기업 회원 대시보드다(2026-11-10 사용자). */
const COMPANY_DASHBOARD_HREF = '/mypage/company';

export interface LoginPageProps {
  /** `?redirect=` 를 거른 값(`shared/lib/returnPath.ts`). 같은 사이트의 경로가 아니면 `null` 이다. */
  returnPath: string | null;
}

/**
 * 기업 회원 로그인. 기준은 web 의 기업 회원 탭(`apps/web/src/features/sign-in/ui/CompanySignInPanel.tsx`,
 * `apps/web/src/views/login/ui/LoginPage.tsx`) 이고, biz 는 기업 회원 전용이라 일반 회원 탭과 간편 로그인이 없다.
 *
 * 로그인하면, 또는 이미 기업 회원으로 로그인한 사람이 오면 돌아갈 화면(없으면 대시보드) 으로 보낸다. 다른 역할로 로그인한 사람에게는
 * 기업 회원으로 로그인하라는 안내와 폼을 보인다 — 헤더의 신청 내역·마이페이지가 이 사람을 여기로 보낸다
 * (`shared/ui/SiteHeader.tsx`). 기업 계정으로 로그인하면 토큰을 덮어쓴다(`saveTokens`). 토큰이 브라우저 저장소에만 있어
 * 역할은 첫 렌더 뒤에 받는다.
 */
export function LoginPage({ returnPath }: LoginPageProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountState = useMyAccount();
  const alreadyCompany = accountState.kind === 'ready' && accountState.account.role === 'COMPANY';
  const otherRole = accountState.kind === 'ready' && accountState.account.role !== 'COMPANY';

  useEffect(() => {
    if (alreadyCompany) {
      router.replace(returnPath ?? COMPANY_DASHBOARD_HREF);
    }
  }, [alreadyCompany, router, returnPath]);

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
      // 성공하면 화면을 떠나므로 pending 을 풀지 않는다. 풀면 이동 전에 버튼이 잠깐 다시 켜진다.
      router.replace(returnPath ?? COMPANY_DASHBOARD_HREF);
    } catch (caught) {
      setError(signInErrorMessage(caught));
      setPending(false);
    }
  };

  const signUpHref = returnPath ? `/signup?redirect=${encodeURIComponent(returnPath)}` : '/signup';

  return (
    <div className="flex justify-center px-5 pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="flex w-full max-w-104 flex-col">
        <h1 className="text-center text-xl font-bold text-gray-900">기업 회원 로그인</h1>
        <p className="pt-2 pb-8 text-center text-sm text-gray-500">
          오늘의 공고 기업 계정으로 로그인합니다.
        </p>
        {otherRole ? (
          <p className="mb-4 rounded-md bg-blue-00 px-4 py-3 text-sm text-gray-700">
            지금 로그인한 계정은 기업 회원이 아닙니다. 공고 등록과 기업 정보는 기업 회원 계정으로
            로그인해야 쓸 수 있습니다.
          </p>
        ) : null}
        <SignInForm
          onSubmit={handleSubmit}
          pending={pending}
          error={error}
          emailLabel="업무용 이메일"
        />
        <div className="flex justify-center gap-2 pt-12 text-sm">
          <span className="text-gray-500">아직 기업 회원이 아니신가요?</span>
          <Link href={signUpHref} className="font-medium text-gray-900 hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * `signInCompany` 의 오류. 401 은 `INVALID_COMPANY_CREDENTIALS`, 403 은 정지·탈퇴다. `HttpError` 가 본문 `code` 를
 * 들고 있지 않아 상태 코드로만 가른다(web 과 같다).
 */
function signInErrorMessage(error: unknown): string {
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
