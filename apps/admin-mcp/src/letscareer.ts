/**
 * 렛츠커리어 통합로그인(SSO). 관리자 콘솔의 `apps/admin/src/shared/api/letscareer.ts` 와 같은 API 다.
 *
 * 쓰임이 둘이다.
 * - 관리자 본인 확인: 비밀번호가 맞는지만 본다. 받은 LC 토큰은 버린다. 오공고 토큰으로 바꾸지 않으므로
 *   그 사람의 콘솔 세션(오공고 refresh)은 그대로다(PRD 3 절).
 * - 서비스 계정 로그인: LC 토큰을 오공고 토큰으로 바꾼다(`ogonggo.ts`).
 *
 * 헤더는 `content-type` 만 보낸다. 서버에서 부르므로 `Origin` 이 없어 렛츠커리어 CORS 에 걸리지 않는다.
 */

export type SsoResult =
  | { ok: true; letsCareerAccessToken: string }
  | { ok: false; reason: 'invalid_credentials' | 'unavailable'; detail: string };

export interface SsoOptions {
  apiOrigin: string;
  redirectUri: string;
  fetch?: typeof fetch;
}

export async function authenticateWithLetsCareer(
  credentials: { email: string; password: string },
  options: SsoOptions,
): Promise<SsoResult> {
  const fetchImpl = options.fetch ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(`${options.apiOrigin}/api/v1/sso/authenticate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...credentials, redirectUri: options.redirectUri }),
    });
  } catch (error) {
    return { ok: false, reason: 'unavailable', detail: `fetch failed: ${String(error)}` };
  }

  const text = await response.text().catch(() => '');
  let body: { code?: string; data?: { redirectUrl?: string } } | undefined;
  try {
    body = JSON.parse(text);
  } catch {
    // 평문 오류(게이트웨이, CORS)다. 아래에서 상태 코드로 판정한다.
  }

  if (!response.ok) {
    if (body?.code === 'SSO_INVALID_CREDENTIALS') {
      return { ok: false, reason: 'invalid_credentials', detail: body.code };
    }
    // `SSO_REDIRECT_URI_MISMATCH` 는 사람 잘못이 아니라 설정 문제다. 로그에 남기고 연결 실패로 보인다.
    return {
      ok: false,
      reason: 'unavailable',
      detail: `status ${response.status} ${body?.code ?? text.slice(0, 200)}`,
    };
  }

  const redirectUrl = body?.data?.redirectUrl;
  const token = redirectUrl ? tokenFrom(redirectUrl) : null;
  if (!token) {
    return { ok: false, reason: 'unavailable', detail: 'redirectUrl 에 token 이 없습니다.' };
  }
  return { ok: true, letsCareerAccessToken: token };
}

/** `redirectUri?token=...&refreshToken=...` 의 `token`. */
function tokenFrom(redirectUrl: string): string | null {
  try {
    return new URL(redirectUrl, 'https://placeholder.invalid').searchParams.get('token');
  } catch {
    return null;
  }
}
