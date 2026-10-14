'use client';

import { useEffect } from 'react';
import { isSignedIn } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { identifyUser, resetUser } from './posthog';

/**
 * 로그인 상태를 PostHog 사용자에 맞춘다. 계정은 헤더와 같은 요청을 함께 쓴다(`useMyAccount`).
 *
 * 첫 렌더는 로그인 여부와 상관없이 `signedOut` 이다(`useMyAccount` 주석). 그래서 저장소의 토큰도
 * 없을 때만 로그아웃으로 보고 끊는다.
 */
export function PostHogIdentify() {
  const account = useMyAccount();

  useEffect(() => {
    if (account.kind === 'ready') {
      identifyUser(account.account.userId, { role: account.account.role });
    } else if (account.kind === 'signedOut' && !isSignedIn()) {
      resetUser();
    }
  }, [account]);

  return null;
}
