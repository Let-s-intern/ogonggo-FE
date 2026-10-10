'use client';

import { useSyncExternalStore } from 'react';
import { isSignedIn, subscribeTokens } from './authTokens';

/**
 * 로그인 상태. 토큰이 브라우저 저장소에만 있어 서버 렌더와 첫 하이드레이션은 늘 `false` 이고,
 * 마운트 뒤 저장소를 읽어 바뀐다 — 헤더(`SiteHeader`) 와 같은 방식이다.
 */
export function useSignedIn(): boolean {
  return useSyncExternalStore(subscribeTokens, isSignedIn, () => false);
}
