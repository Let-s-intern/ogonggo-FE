'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from '@ogonggo/api';
import { clearTokens } from './authTokens';

/**
 * 서버에 로그아웃(`signOut`, 리프레시 토큰 폐기) 을 알린 뒤 두 토큰을 지우고 `/` 로 간다. 기준은
 * `apps/web/src/features/sign-out/model/useSignOut.ts` 다. `signOut` 이 실패해도(액세스 토큰 만료, 네트워크)
 * 화면에서는 로그아웃한다 — 사용자가 누른 것은 이 브라우저에서 나가는 일이다.
 */
export function useSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = async () => {
    setPending(true);
    try {
      await signOut();
    } catch {
      // 위 주석대로 실패해도 지운다.
    } finally {
      clearTokens();
      setPending(false);
      router.replace('/');
    }
  };

  return { signOut: run, pending };
}
