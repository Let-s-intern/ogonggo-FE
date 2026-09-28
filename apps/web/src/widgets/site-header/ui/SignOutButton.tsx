'use client';

import { useState } from 'react';
import { signOut } from '@ogonggo/api';
import { Button } from '@ogonggo/ui';
import { clearTokens } from '@/shared/api/authTokens';

/**
 * 서버에 로그아웃(`signOut`, 리프레시 토큰 폐기) 을 알린 뒤 두 토큰을 지운다. `signOut` 이 실패해도(액세스
 * 토큰 만료, 네트워크) 화면에서는 로그아웃한다 — 사용자가 누른 것은 이 브라우저에서 나가는 일이다.
 * `signOut` 의 401 은 재발급하지 않는다(`shared/api/reissue.ts` 의 인증 API 제외).
 */
export function SignOutButton() {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      await signOut();
    } catch {
      // 위 주석대로 실패해도 지운다.
    } finally {
      clearTokens();
      setPending(false);
    }
  };

  return (
    <Button size="sm" variant="secondary" disabled={pending} onClick={handleClick}>
      로그아웃
    </Button>
  );
}
