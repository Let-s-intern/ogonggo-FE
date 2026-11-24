'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { subscribeTokens } from '@/shared/api/authTokens';
import { startPageView } from './contentEvents';
import { syncPageContext } from './dataLayer';

/**
 * 첫 로드, 화면 이동, 로그인·로그아웃 뒤에 `page_context` 를 다시 보낸다. 화면 이동은 광고 노출을 세는 한 페이지 조회의
 * 경계이기도 하다(`startPageView`).
 *
 * 로그인 상태는 토큰이 바뀔 때 도는 알림(`subscribeTokens`)으로 안다. 액세스 토큰 재발급도 같은
 * 알림을 내지만 로그인 상태가 그대로면 `syncPageContext` 가 건너뛴다.
 */
export function PageContextTracker() {
  const pathname = usePathname();

  useEffect(() => {
    syncPageContext();
    // 경로가 바뀌면 새 페이지 조회다. 광고 노출을 노출 id 마다 한 번만 세는 범위가 여기서 끝난다.
    startPageView();
  }, [pathname]);

  useEffect(() => subscribeTokens(syncPageContext), []);

  return null;
}
