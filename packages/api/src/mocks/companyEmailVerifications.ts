import { http, HttpResponse, type HttpHandler } from 'msw';

/**
 * 기업회원 가입의 회사 이메일 인증 목. 비즈니스 앱 광고 신청서 3단계(비회원이 신청하며 가입)가 쓴다.
 * 백엔드에 아직 없다. 경로·요청·응답은 `.claude/tasks/memos/백엔드-요청-광고-시스템-business.md` 에 적었다.
 *
 * - 인증번호는 보내지 않는다. 숫자 6자리면 `000000` 만 빼고 맞는 것으로 본다(틀린 번호 문구 확인용).
 * - `user@example.com` 은 이미 가입된 이메일로 본다(가입 목과 같은 값).
 */

const ALREADY_REGISTERED = 'user@example.com';
const WRONG_CODE = '000000';

const ok = (data: unknown) =>
  HttpResponse.json({ status: 200, message: '요청이 성공했습니다.', data });

const error = (status: number, code: string, message: string) =>
  HttpResponse.json({ status, code, message }, { status });

export const companyEmailVerificationHandlers: HttpHandler[] = [
  http.post('*/api/v1/auth/company/email-verifications', async ({ request }) => {
    const { email } = (await request.json()) as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error(400, 'INVALID_EMAIL', '이메일 형식이 올바르지 않습니다.');
    }
    if (email === ALREADY_REGISTERED) {
      return error(409, 'EMAIL_ALREADY_EXISTS', '이미 가입된 이메일입니다.');
    }
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 19);
    return ok({ expiresAt });
  }),
  http.post('*/api/v1/auth/company/email-verifications/confirm', async ({ request }) => {
    const { email, code } = (await request.json()) as { email?: string; code?: string };
    if (!email || !code || !/^\d{6}$/.test(code) || code === WRONG_CODE) {
      return error(400, 'INVALID_VERIFICATION_CODE', '인증번호가 올바르지 않습니다.');
    }
    return ok({ verificationToken: `mock-email-verification.${email}` });
  }),
];
