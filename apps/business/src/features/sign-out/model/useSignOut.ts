'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from '@ogonggo/api';
import { clearTokens } from '@/shared/api/authTokens';

/**
 * 서버에 로그아웃(`signOut`, 리프레시 토큰 폐기) 을 알린 뒤 두 토큰을 지운다. `signOut` 이 실패해도 화면에서는
 * 로그아웃한다. web 의 `features/sign-out/model/useSignOut.ts` 에서 푸시 토큰 해제를 뺀 것이다 — 비즈니스에는
 * 푸시가 없다.
 *
 * `redirectTo` 는 로그인해야만 볼 수 있는 화면(마이페이지)에서 부를 때 준다.
 */
export function useSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = async (redirectTo?: string) => {
    setPending(true);
    try {
      await signOut();
    } catch {
      // 위 주석대로 실패해도 지운다.
    } finally {
      clearTokens();
      setPending(false);
      if (redirectTo) router.replace(redirectTo);
    }
  };

  return { signOut: run, pending };
}
