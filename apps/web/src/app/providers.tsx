'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { setAccessTokenProvider } from '@ogonggo/api';
import { getAccessToken } from '@/shared/api/authTokens';

// 브라우저의 API 호출에 로그인 토큰을 붙인다. 서버에서는 `getAccessToken` 이 null 이라 서버 컴포넌트의
// 요청은 지금처럼 토큰 없이 간다. 보관 방식은 authTokens.ts 주석에 있다.
setAccessTokenProvider(getAccessToken);

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
