'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { saveTokens } from '@/shared/api/authTokens';

/**
 * 어드민에서 넘어온 로그인을 받는다. 주소가 `#accessToken=…&refreshToken=…` 이다
 * (`apps/admin/src/shared/api/webHandoff.ts`).
 *
 * 토큰은 저장하기 전에 주소에서 먼저 지운다. 남겨 두면 주소창과 방문 기록에 리프레시 토큰이 남는다.
 * 둘 중 하나라도 없으면 저장하지 않고 홈으로만 보낸다 — 웹은 리프레시 토큰이 있어야 로그인으로 본다.
 *
 * 받은 토큰을 따로 확인하지 않는다. 무효한 토큰이면 첫 요청의 401 에서 재발급이 실패하고, 그때
 * `shared/api/reissue.ts` 가 토큰을 지우고 로그인 화면으로 보낸다. 이메일 로그인과 같은 길이다.
 *
 * 개발 모드의 StrictMode 는 effect 를 두 번 돌린다. 두 번째는 이미 지운 주소를 읽으므로 ref 로 한 번만 돈다
 * (`views/letscareer-callback/ui/LetsCareerCallbackPage.tsx` 와 같다).
 */
export function AuthHandoffPage() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, '', window.location.pathname);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      saveTokens({ accessToken, refreshToken });
    }
    router.replace('/');
  }, [router]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-white px-5">
      <p role="status" className="text-sm text-gray-500">
        로그인하는 중입니다...
      </p>
    </main>
  );
}
