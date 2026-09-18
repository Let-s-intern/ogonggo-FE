'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { setAccessTokenProvider, setUnauthorizedHandler } from '@ogonggo/api';
import { getAccessToken } from '@/shared/api/authTokens';
import { handleUnauthorized } from '@/shared/api/reissue';

// 브라우저의 API 호출에 로그인 토큰을 붙인다. 서버에서는 `getAccessToken` 이 null 이라 서버 컴포넌트의
// 요청은 지금처럼 토큰 없이 간다. 보관 방식은 authTokens.ts 주석에 있다.
setAccessTokenProvider(getAccessToken);
// 401 이면 리프레시 토큰으로 한 번 재발급하고 원 요청을 다시 보낸다. 실패하면 로그인 화면으로 간다.
setUnauthorizedHandler(handleUnauthorized);

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
