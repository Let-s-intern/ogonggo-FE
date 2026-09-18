import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { signInCompany, type CompanySignInRequest } from '@ogonggo/api';
import { Button, Callout, Card, CardTitle, Field, Input } from '@ogonggo/ui';
import { saveAccessToken } from '@/shared/api/accessToken';
import { unwrapData } from '@/shared/api/unwrapData';

/**
 * 관리자 로그인.
 *
 * 어드민 API 는 토큰을 발급하지 않는다. 관리자도 사용자 API 의 기업 로그인(`signInCompany`) 으로
 * 토큰을 받는다(`vite.config.ts` 의 `/api/v1/auth` 프록시). 역할이 ADMIN 인지는 여기서 알 수 없고,
 * 어드민 API 가 403 으로 알려준다.
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
              로그인하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.
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
