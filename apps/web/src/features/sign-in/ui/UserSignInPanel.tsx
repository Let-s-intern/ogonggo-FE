'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  buildSocialLoginUrl,
  letsCareerCallbackUri,
  type LetsCareerSocialProvider,
} from '@/shared/api/letscareer';
import {
  letsCareerSignInErrorMessage,
  pathAfterLetsCareerSignIn,
  signInWithLetsCareerEmail,
} from '@/shared/api/letsCareerSignIn';
import { saveReturnPath } from '@/shared/lib/returnPath';
import { SignInForm } from './SignInForm';
import { SocialSignInButtons } from './SocialSignInButtons';

export interface UserSignInPanelProps {
  /** 로그인 뒤 돌아갈 화면. 이미 걸러진 값이다(`shared/lib/returnPath.ts`). */
  returnPath: string | null;
  /** 처음부터 보일 실패 문구. 간편 로그인 콜백이 실패해 돌아왔을 때 쓴다. */
  initialError?: string | null;
}

/**
 * 일반 회원 탭. 렛츠커리어 계정의 이메일 로그인과 카카오·네이버 간편 로그인.
 *
 * 이메일 로그인은 화면을 떠나지 않는다. 렛츠커리어 SSO 로 토큰을 받아 오공고 토큰으로 바꾼 뒤 이동한다
 * (`shared/api/letsCareerSignIn.ts`).
 */
export function UserSignInPanel({ returnPath, initialError = null }: UserSignInPanelProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const handleSubmit = async (credentials: { email: string; password: string }) => {
    setPending(true);
    setError(null);
    try {
      const { isNewUser } = await signInWithLetsCareerEmail(credentials);
      // 성공하면 화면을 떠나므로 pending 을 풀지 않는다.
      router.replace(pathAfterLetsCareerSignIn(isNewUser, returnPath));
    } catch (caught) {
      setError(letsCareerSignInErrorMessage(caught));
      setPending(false);
    }
  };

  // 간편 로그인은 렛츠커리어를 다녀온다. `redirect_uri` 에 쿼리를 붙일 수 없어(화이트리스트가 쿼리까지 비교한다)
  // 돌아갈 화면은 떠나기 전에 `sessionStorage` 에 적고 콜백이 꺼낸다.
  const handleSocialSelect = (provider: LetsCareerSocialProvider) => {
    saveReturnPath(returnPath);
    window.location.assign(buildSocialLoginUrl(provider, letsCareerCallbackUri()));
  };

  return (
    <div className="flex flex-col">
      <p className="pb-4 text-sm text-gray-500">개인 계정으로 로그인합니다.</p>
      <SignInForm onSubmit={handleSubmit} pending={pending} error={error} />
      <p className="pt-8 pb-4 text-center text-sm text-gray-400">또는 간편 로그인</p>
      <SocialSignInButtons onSelect={handleSocialSelect} />
      <div className="flex justify-center pt-12 text-sm font-medium text-gray-900">
        <Link href="/signup" className="hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}
