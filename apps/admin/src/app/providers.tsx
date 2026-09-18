import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { HttpError } from '@ogonggo/api';
import { clearAccessToken } from '@/shared/api/accessToken';
import { router } from './routes';

/** 401·403 을 받았을 때 로그인 화면에 띄울 문구. */
const AUTH_ERROR_MESSAGES: Record<number, string> = {
  401: '로그인이 필요합니다',
  403: '관리자 계정이 아닙니다',
};

function authErrorMessage(error: unknown): string | undefined {
  return error instanceof HttpError ? AUTH_ERROR_MESSAGES[error.status] : undefined;
}

/**
 * 어느 화면에서든 401·403 이 오면 토큰을 버리고 로그인 화면으로 보낸다.
 *
 * 403 도 로그인으로 보낸다. 역할은 토큰 안에 박혀 있어서, ADMIN 이 아닌 토큰으로는 어드민 API 가
 * 전부 403 이다. 화면에 남아 봐야 모든 목록이 오류를 낸다.
 *
 * 로그인 화면 자신의 실패(틀린 비밀번호의 401) 는 그 화면이 보여준다.
 */
function handleAuthError(error: unknown) {
  const message = authErrorMessage(error);
  const { pathname, search } = router.state.location;
  if (!message || pathname === '/login') {
    return;
  }
  clearAccessToken();
  void router.navigate('/login', {
    replace: true,
    state: { from: `${pathname}${search}`, message },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleAuthError }),
        mutationCache: new MutationCache({ onError: handleAuthError }),
        defaultOptions: {
          queries: {
            // 401·403 은 다시 보내도 같다. 기본 재시도(3회, 최대 7초) 를 기다리지 않고 바로 보낸다.
            retry: (failureCount, error) => !authErrorMessage(error) && failureCount < 3,
          },
        },
      }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
