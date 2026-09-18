'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { LETSCAREER_CALLBACK_PATH, parseLetsCareerRedirect } from '@/shared/api/letscareer';
import {
  exchangeLetsCareerToken,
  type LetsCareerSignInFailure,
  letsCareerSignInFailureOf,
  pathAfterLetsCareerSignIn,
} from '@/shared/api/letsCareerSignIn';
import { recordPendingSocialMethod } from '@/shared/lib/lastSignInMethod';
import { takeReturnPath } from '@/shared/lib/returnPath';

/**
 * 렛츠커리어 간편 로그인이 돌려보내는 화면(`/auth/letscareer/callback`). 처리 중 표시만 있다.
 *
 * 주소를 읽자마자 `history.replaceState` 로 쿼리를 지운다. 렛츠커리어 토큰이 주소창·방문 기록·이후 요청의
 * `Referer` 에 남지 않게 교환보다 먼저 지운다. 읽는 형식은 `parseLetsCareerRedirect` 주석에 있다.
 *
 * 성공하면 오공고 토큰을 저장하고 커리어 정보(첫 로그인) 나 돌아갈 화면으로, 실패하면 까닭을 `?error=` 에 실어
 * 로그인 화면으로 보낸다. 돌아갈 화면은 로그인 화면이 떠나기 전에 `sessionStorage` 에 적어 둔 것이다.
 *
 * 개발 모드의 StrictMode 는 effect 를 두 번 돌린다. 두 번째는 이미 지운 주소를 읽어 실패로 가므로 ref 로 한 번만
 * 돈다.
 */
export function LetsCareerCallbackPage() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    const result = parseLetsCareerRedirect(window.location.href);
    window.history.replaceState(null, '', LETSCAREER_CALLBACK_PATH);
    const returnPath = takeReturnPath();

    const backToLogin = (failure: LetsCareerSignInFailure) => {
      const params = new URLSearchParams({ error: failure });
      if (returnPath) {
        params.set('redirect', returnPath);
      }
      router.replace(`/login?${params.toString()}`);
    };

    if (result.kind === 'already-signed-up') {
      backToLogin('already-signed-up');
      return;
    }
    if (result.kind === 'error') {
      backToLogin('social-error');
      return;
    }
    if (result.kind === 'invalid') {
      backToLogin('invalid-callback');
      return;
    }

    exchangeLetsCareerToken(result.letsCareerAccessToken)
      .then(({ isNewUser }) => {
        recordPendingSocialMethod();
        router.replace(pathAfterLetsCareerSignIn(isNewUser, returnPath));
      })
      .catch((error: unknown) => backToLogin(letsCareerSignInFailureOf(error)));
  }, [router]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-white px-5">
      <p role="status" className="text-sm text-gray-500">
        로그인하는 중입니다...
      </p>
    </main>
  );
}
