'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { setAccessTokenProvider, setUnauthorizedHandler } from '@ogonggo/api';
import { ToastProvider } from '@ogonggo/ui';
import { getAccessToken } from '@/shared/api/authTokens';
import { handleUnauthorized } from '@/shared/api/reissue';

// 브라우저의 API 호출에 비즈니스 출처의 로그인 토큰을 붙이고, 401 이면 한 번 재발급한다. web `providers.tsx` 와 같다.
setAccessTokenProvider(getAccessToken);
setUnauthorizedHandler(handleUnauthorized);

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
