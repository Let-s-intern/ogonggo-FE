import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { HttpError, signInCompany, type CompanySignInRequest } from '@ogonggo/api';
import { listJobs } from '@ogonggo/api/src/admin';
import { Button, Callout, Card, CardTitle, Field, Input } from '@ogonggo/ui';
import { isMockEnabled } from '@/app/enableMocking';
import { saveAccessToken } from '@/shared/api/accessToken';
import { NOT_ADMIN_MESSAGE } from '@/shared/api/authErrorMessages';
import { unwrapData } from '@/shared/api/unwrapData';

/** 비밀번호가 틀렸을 때(`INVALID_COMPANY_CREDENTIALS`) 와 그 밖의 로그인 실패. */
const SIGN_IN_FAILED_MESSAGE = '로그인하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.';

/**
 * 토큰은 받았는데 어드민 API 가 그것을 받아 주지 않았다는 실패. 문구를 그대로 들고 다닌다.
 *
 * 비밀번호 오류와 같은 401 이라서 상태 코드만으로는 가를 수 없다. 어느 단계에서 실패했는지는
 * 여기서만 알 수 있으므로, 그 자리에서 문구를 정해 담는다.
 */
class AdminAccessDenied extends Error {}

/**
 * 받은 토큰이 어드민 API 에 통하는지 한 번 확인한다. 통하지 않으면 던진다.
 *
 * 로그인만으로는 관리자인지 알 수 없다 — 토큰은 사용자 API 가 주고, 역할을 보는 쪽은 어드민 API 다.
 * 확인 없이 저장하면 어느 계정이든 로그인한 것처럼 보이다가 메뉴를 누르는 순간 로그인 화면으로
 * 돌아온다. 사용자는 그것을 "로그인이 안 된다" 로 겪는다.
 *
 * 가장 가벼운 목록 하나(`page=1&size=1`) 를 부른다. 토큰은 아직 저장 전이라
 * `setAccessTokenProvider` 가 읽을 곳에 없으므로, 이 한 번만 헤더에 직접 싣는다.
 *
 * 목 모드에서는 건너뛴다. 목 핸들러는 토큰을 보지 않는다(`app/RequireAuth.tsx` 가 목 모드에서
 * 검사를 건너뛰는 것과 같은 이유다).
 */
async function checkAdminAccess(accessToken: string): Promise<void> {
  if (isMockEnabled) {
    return;
  }
  try {
    await listJobs({ page: 1, size: 1 }, { headers: { Authorization: `Bearer ${accessToken}` } });
  } catch (error) {
    if (!(error instanceof HttpError)) {
      throw error;
    }
    // 403 은 로그인한 계정의 역할이 ADMIN 이 아니라는 뜻이다.
    if (error.status === 403) {
      throw new AdminAccessDenied(NOT_ADMIN_MESSAGE);
    }
    // 401 은 방금 로그인한 토큰을 어드민 API 가 검증하지 못했다는 뜻이다. 두 API 의 JWT 시크릿이
    // 다르면 이렇게 된다. 비밀번호를 다시 쳐 봐야 소용없으므로 그렇게 들리지 않는 말을 쓴다.
    if (error.status === 401) {
      throw new AdminAccessDenied(
        '로그인은 됐지만 관리자 서버가 인증을 받지 못했습니다. 관리자에게 문의하세요',
      );
    }
    throw error;
  }
}

/**
 * 관리자 로그인.
 *
 * 어드민 API 는 토큰을 발급하지 않는다. 관리자도 사용자 API 의 기업 로그인(`signInCompany`) 으로
 * 토큰을 받는다(`vite.config.ts` 의 `/api/v1/auth` 프록시). 역할이 ADMIN 인지는 그 토큰으로
 * 어드민 API 를 한 번 불러서 가린다(`checkAdminAccess`).
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // `RequireAuth` 와 `app/providers.tsx` 의 401·403 처리가 넘겨준다.
  const state = location.state as { from?: string; message?: string } | null;
  const from = state?.from ?? '/';
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = useMutation({
    mutationFn: async (body: CompanySignInRequest) => {
      const data = await unwrapData(signInCompany(body));
      if (!data?.accessToken) {
        throw new Error('로그인 응답에 accessToken 이 없습니다.');
      }
      // 확인이 실패하면 여기서 던진다. 토큰은 저장되지 않는다.
      await checkAdminAccess(data.accessToken);
      return data.accessToken;
    },
    onSuccess: (accessToken) => {
      saveAccessToken(accessToken);
      // 다른 계정으로 받아 둔 응답이 남아 있으면 새 계정 화면에 섞여 나온다.
      queryClient.clear();
      void navigate(from, { replace: true });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    signIn.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-96 p-6">
        <CardTitle className="pb-6">오공고 관리자 로그인</CardTitle>
        {state?.message ? (
          <Callout tone="warning" className="mb-4">
            {state.message}
          </Callout>
        ) : null}
        <form onSubmit={handleSubmit}>
          <Field label="이메일" htmlFor="login-email">
            <Input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field label="비밀번호" htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          {signIn.isError ? (
            <Callout tone="error" className="mb-4">
              {signIn.error instanceof AdminAccessDenied
                ? signIn.error.message
                : SIGN_IN_FAILED_MESSAGE}
            </Callout>
          ) : null}
          <Button type="submit" className="w-full" disabled={signIn.isPending}>
            로그인
          </Button>
        </form>
      </Card>
    </div>
  );
}
