import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { HttpError } from '@ogonggo/api';
import { listJobs } from '@ogonggo/api/src/admin';
import { Button, Callout, Card, CardTitle, Field, Input } from '@ogonggo/ui';
import { isMockEnabled } from '@/app/enableMocking';
import { saveAccessToken } from '@/shared/api/accessToken';
import { setAdminTokenUnverified } from '@/shared/api/adminTokenUnverified';
import {
  NOT_ADMIN_MESSAGE,
  corsRejectedMessage,
  isCorsRejection,
  serverErrorMessage,
} from '@/shared/api/authErrorMessages';
import { LetsCareerApiError, letsCareerCallbackUri } from '@/shared/api/letscareer';
import { signInWithLetsCareerEmail } from '@/shared/api/letsCareerSignIn';

/** 원인을 가릴 단서가 하나도 없는 로그인 실패. */
const SIGN_IN_FAILED_MESSAGE = '로그인하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.';

/**
 * 토큰은 받았는데 어드민 API 가 관리자가 아니라고 한 실패(403). 문구를 그대로 들고 다닌다.
 *
 * 렛츠커리어 단계의 거절도 403 이라 상태 코드만으로는 가를 수 없다. 어느 단계에서 실패했는지는
 * 여기서만 알 수 있으므로, 그 자리에서 문구를 정해 담는다.
 */
class AdminAccessDenied extends Error {}

/**
 * 받은 토큰이 어드민 API 에 통하는지 한 번 확인한다. 어드민이 아니라고 하면 던지고, 판단하지
 * 못했으면 `true`(확인 못 함) 를 돌려준다.
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
async function checkAdminAccess(accessToken: string): Promise<boolean> {
  if (isMockEnabled) {
    return false;
  }
  try {
    await listJobs({ page: 1, size: 1 }, { headers: { Authorization: `Bearer ${accessToken}` } });
    return false;
  } catch (error) {
    if (!(error instanceof HttpError)) {
      throw error;
    }
    // CORS 거절도 403 이다. 역할 문제로 읽히면 계정을 고치러 가게 되므로 먼저 가른다.
    if (isCorsRejection(error)) {
      throw new AdminAccessDenied(corsRejectedMessage());
    }
    // 403 은 서버가 확실히 아니라고 한 것이다. 로그인한 계정의 역할이 ADMIN 이 아니다. 막는다.
    if (error.status === 403) {
      throw new AdminAccessDenied(NOT_ADMIN_MESSAGE);
    }
    // 401 은 "관리자가 아니다" 가 아니라 "서버가 판단하지 못했다" 이므로 막지 않는다. 어드민 서버에
    // JWT 시크릿이 없으면 어떤 토큰이든 401 이고(`shared/api/adminTokenUnverified.ts`), 모르는 것을
    // 근거로 막으면 관리자도 프런트를 볼 수 없다. 통과시키되 왜 데이터가 없는지는 콘솔 전체에
    // 남긴다 — 그 기록이 이 `true` 다.
    if (error.status === 401) {
      return true;
    }
    throw error;
  }
}

/**
 * 렛츠커리어 단계(`ssoAuthenticate`) 의 실패 문구. 오공고 단계의 401·403 과 같은 말을 쓰지 않는다 —
 * 어느 서버가 거절했는지에 따라 할 일이 다르다.
 *
 * 두 `code` 모두 400 이라 상태 코드로는 가를 수 없다.
 */
function letsCareerErrorMessage(error: LetsCareerApiError): string {
  if (error.code === 'SSO_INVALID_CREDENTIALS') {
    return '렛츠커리어 이메일 또는 비밀번호가 올바르지 않습니다';
  }
  // 화이트리스트는 렛츠커리어 운영 쪽이 등록한다. 다시 시도해도 같으므로 계정 이야기를 하지 않는다.
  if (error.code === 'SSO_REDIRECT_URI_MISMATCH') {
    return `렛츠커리어에 등록되지 않은 주소(${letsCareerCallbackUri()}) 입니다. 렛츠커리어 SSO 허용 목록에 이 주소를 추가해야 합니다`;
  }
  // 오공고 쪽 `isCorsRejection` 과 같은 거절이 렛츠커리어에서도 온다. 평문이라 `code` 가 비어 있고,
  // 문구가 없으면 "failed: 403" 만 남아 계정 문제로 읽힌다.
  if (error.status === 403 && error.body.includes('Invalid CORS request')) {
    return `렛츠커리어가 이 주소(${window.location.origin}) 에서 오는 요청을 막았습니다(CORS). 렛츠커리어의 CORS 허용 목록에 이 도메인을 추가해야 합니다`;
  }
  if (error.status >= 500) {
    return '렛츠커리어 서버에 문제가 있습니다. 잠시 후 다시 시도해 주세요';
  }
  // 그 밖의 400 대. 렛츠커리어가 한국어 문구를 주므로 그대로 보인다.
  return error.message;
}

/**
 * 로그인 실패를 원인별 문구로 바꾼다. 모두 "비밀번호를 확인해 주세요" 로 뭉치면 CORS 거절이나 서버
 * 오류에도 비밀번호만 다시 치게 된다.
 *
 * 백엔드 JSON 오류는 그 `message` 를 그대로 쓴다 — 거절된 렛츠커리어 토큰(401
 * `INVALID_LETSCAREER_TOKEN`), 정지·탈퇴 계정(403 `USER_SUSPENDED`·`USER_WITHDRAWN`) 을 서버가 이미
 * 사람이 읽을 말로 준다.
 */
function signInErrorMessage(error: unknown): string {
  if (error instanceof AdminAccessDenied) {
    return error.message;
  }
  if (error instanceof LetsCareerApiError) {
    return letsCareerErrorMessage(error);
  }
  if (isCorsRejection(error)) {
    return corsRejectedMessage();
  }
  if (error instanceof HttpError) {
    return serverErrorMessage(error) ?? `로그인 요청이 실패했습니다 (HTTP ${error.status})`;
  }
  // `fetch` 는 응답을 받지 못하면(네트워크 끊김, 서버 다운) `TypeError` 를 던진다.
  if (error instanceof TypeError) {
    return '서버에 연결하지 못했습니다. 네트워크나 서버 상태를 확인해 주세요';
  }
  return error instanceof Error && error.message ? error.message : SIGN_IN_FAILED_MESSAGE;
}

/**
 * 관리자 로그인.
 *
 * 어드민 API 는 토큰을 발급하지 않는다. 관리자도 웹과 같은 렛츠커리어 통합로그인(SSO) 으로 토큰을 받는다 —
 * 렛츠커리어에 이메일·비밀번호를 보내고, 받은 렛츠커리어 토큰을 사용자 API 가 오공고 토큰으로 바꿔 준다
 * (`shared/api/letsCareerSignIn.ts`, `vite.config.ts` 의 `/letscareer-api`·`/api/v1/auth` 프록시).
 * 입력 칸은 이메일과 비밀번호 그대로고, 카카오·네이버 간편 로그인은 두지 않는다.
 *
 * 역할이 ADMIN 인지는 받은 토큰으로 어드민 API 를 한 번 불러서 가린다(`checkAdminAccess`).
 * 아니라고 한 것(403) 만 막는다. 판단하지 못한 것(401) 은 통과시키고 콘솔에 이유를 남긴다.
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
    mutationFn: async (credentials: { email: string; password: string }) => {
      const accessToken = await signInWithLetsCareerEmail(credentials);
      // 관리자가 아니면(403) 여기서 던진다. 토큰은 저장되지 않는다.
      const tokenUnverified = await checkAdminAccess(accessToken);
      return { accessToken, tokenUnverified };
    },
    onSuccess: ({ accessToken, tokenUnverified }) => {
      // 매번 다시 적는다. 지난 로그인의 판정이 남아 안내만 떠 있는 일이 없게 한다.
      setAdminTokenUnverified(tokenUnverified);
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
              {signInErrorMessage(signIn.error)}
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
