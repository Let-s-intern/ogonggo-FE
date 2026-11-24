'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { subscribeTokens } from '@/shared/api/authTokens';
import { syncPageContext } from './dataLayer';

/**
 * 첫 로드, 화면 이동, 로그인·로그아웃 뒤에 `page_context` 를 다시 보낸다. 기준은
 * `apps/web/src/shared/analytics/PageContextTracker.tsx` 다. 웹이 같은 effect 에서 광고 노출의 한 페이지 조회를
 * 여는 `startPageView` 는 이 앱에 노출 집계가 없어 옮기지 않았다.
 *
 * 로그인 상태는 토큰이 바뀔 때 도는 알림(`subscribeTokens`)으로 안다. 액세스 토큰 재발급은 알림을 내지 않고,
 * 로그인 상태가 그대로면 `syncPageContext` 가 건너뛴다.
 */
export function PageContextTracker() {
  const pathname = usePathname();

  useEffect(() => {
    syncPageContext();
  }, [pathname]);

  useEffect(() => subscribeTokens(syncPageContext), []);

  return null;
}
