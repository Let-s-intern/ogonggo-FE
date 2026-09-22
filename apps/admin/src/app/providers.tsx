import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { HttpError } from '@ogonggo/api';
import { clearAccessToken } from '@/shared/api/accessToken';
import { isAdminTokenUnverified } from '@/shared/api/adminTokenUnverified';
import { authErrorMessage } from '@/shared/api/authErrorMessages';
import { router } from './routes';

/**
 * 어느 화면에서든 401·403 이 오면 토큰을 버리고 로그인 화면으로 보낸다.
 *
 * 403 도 로그인으로 보낸다. 역할은 토큰 안에 박혀 있어서, ADMIN 이 아닌 토큰으로는 어드민 API 가
 * 전부 403 이다. 화면에 남아 봐야 모든 목록이 오류를 낸다.
 *
 * 로그인 화면 자신의 실패(틀린 비밀번호의 401) 는 그 화면이 보여준다.
 *
 * 예외가 하나 있다. 로그인 때 어드민 API 가 토큰을 판단하지 못했다면(`isAdminTokenUnverified`),
 * 그 뒤의 401 은 만료도 위조도 아니라 서버가 계속 판단하지 못하고 있다는 뜻이다. 그것으로 로그인
 * 화면에 돌려보내면 통과시킨 의미가 없어진다 — 첫 화면이 첫 요청과 함께 로그인으로 튕긴다.
 * 남아서 빈 화면과 안내(`widgets/admin-layout`) 를 보이는 편이 낫다.
 */
function handleAuthError(error: unknown) {
  const message = authErrorMessage(error);
  const { pathname, search } = router.state.location;
  if (!message || pathname === '/login') {
    return;
  }
  if (error instanceof HttpError && error.status === 401 && isAdminTokenUnverified()) {
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
