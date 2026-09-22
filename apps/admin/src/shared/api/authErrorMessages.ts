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

/**
 * 백엔드의 CORS 허용 목록에 이 화면의 도메인이 없어서 막힌 403 인지.
 *
 * 스프링은 허용되지 않은 `Origin` 을 인증보다 먼저 거절하고, 본문은 우리 JSON 오류가 아닌
 * 평문 `Invalid CORS request` 다. 브라우저는 같은 오리진이어도 POST 에는 `Origin` 을 붙이므로
 * 계정·비밀번호와 상관없이 이렇게 막힌다. 권한 없음(403) 이나 정지 계정(403) 과 같은 코드라
 * 본문으로만 가를 수 있다.
 */
export function isCorsRejection(error: unknown): boolean {
  return (
    error instanceof HttpError &&
    error.status === 403 &&
    error.body.includes('Invalid CORS request')
  );
}

export function corsRejectedMessage(): string {
  return `서버가 이 주소(${window.location.origin}) 에서 오는 요청을 막았습니다(CORS). 백엔드의 CORS 허용 목록에 이 도메인을 추가해야 합니다`;
}

/** 백엔드 JSON 오류 본문(`{ status, code, message }`) 의 `message`. 본문이 그 모양이 아니면 없다. */
export function serverErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof HttpError)) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(error.body);
    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      const { message } = parsed;
      return typeof message === 'string' && message ? message : undefined;
    }
  } catch {
    // JSON 이 아닌 본문이다. 게이트웨이나 프록시가 준 오류일 수 있다.
  }
  return undefined;
}

export function authErrorMessage(error: unknown): string | undefined {
  if (isCorsRejection(error)) {
    return corsRejectedMessage();
  }
  return error instanceof HttpError ? AUTH_ERROR_MESSAGES[error.status] : undefined;
}
