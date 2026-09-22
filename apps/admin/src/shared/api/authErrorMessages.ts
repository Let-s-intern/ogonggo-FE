import { HttpError } from '@ogonggo/api';

/**
 * 어드민 API 가 401·403 을 줬을 때 띄우는 문구.
 *
 * 로그인 직후의 확인(`pages/login/ui/LoginPage.tsx`) 과 그 뒤 모든 화면의 전역 처리
 * (`app/providers.tsx`) 가 같은 말을 써야 해서 한곳에 둔다. 같은 403 을 화면마다 다르게 부르면
 * 사용자는 다른 문제로 읽는다.
 */
export const NOT_ADMIN_MESSAGE = '관리자 계정이 아닙니다';

export const AUTH_ERROR_MESSAGES: Record<number, string> = {
  401: '로그인이 필요합니다',
  403: NOT_ADMIN_MESSAGE,
};

export function authErrorMessage(error: unknown): string | undefined {
  return error instanceof HttpError ? AUTH_ERROR_MESSAGES[error.status] : undefined;
}
