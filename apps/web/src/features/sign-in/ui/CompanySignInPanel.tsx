'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HttpError, signInCompany, type SuccessResponseAuthTokenResponse } from '@ogonggo/api';
import { saveTokens } from '@/shared/api/authTokens';
import { SignInForm } from './SignInForm';

export interface CompanySignInPanelProps {
  /** 로그인 뒤 돌아갈 화면. 이미 걸러진 값이다(`shared/lib/returnPath.ts`). */
  returnPath: string | null;
}

/**
 * 기업 회원 탭. 오공고 계정의 이메일·비밀번호 로그인(`signInCompany`). 간편 로그인은 없다.
 *
 * 안내 문구는 디자인에 없어 일반 탭과 같은 자리에 둔다(PRD "화면 > 로그인").
 */
export function CompanySignInPanel({ returnPath }: CompanySignInPanelProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (credentials: { email: string; password: string }) => {
    setPending(true);
    setError(null);
    try {
      // 생성 타입은 `{ data, status }` 로 감싼 모양이지만 httpClient 는 본문을 그대로 돌려준다. 다른 화면과 같다.
      const body = (await signInCompany(
        credentials,
      )) as unknown as SuccessResponseAuthTokenResponse;
      if (!body.data) {
        throw new Error('기업 로그인 응답에 토큰이 없습니다.');
      }
      saveTokens(body.data);
      // 성공하면 화면을 떠나므로 pending 을 풀지 않는다. 풀면 이동 전에 버튼이 잠깐 다시 켜진다.
      router.replace(returnPath ?? '/');
    } catch (caught) {
      setError(companySignInErrorMessage(caught));
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col">
      <p className="pb-4 text-sm text-gray-500">기업 계정으로 로그인합니다.</p>
      <SignInForm onSubmit={handleSubmit} pending={pending} error={error} />
      <div className="flex justify-center pt-12 text-sm font-medium text-gray-900">
        <Link href="/signup/company" className="hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}

/**
 * `signInCompany` 의 오류. 401 은 `INVALID_COMPANY_CREDENTIALS`, 403 은 정지(`USER_SUSPENDED`) 와
 * 탈퇴(`USER_WITHDRAWN`) 다. `httpClient` 의 `HttpError` 가 본문 `code` 를 들고 있지 않아 둘은 상태 코드로만
 * 가르고, 403 은 한 문구로 함께 말한다.
 */
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
