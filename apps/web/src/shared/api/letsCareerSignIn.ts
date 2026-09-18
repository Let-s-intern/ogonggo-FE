import { HttpError, signInWithLetsCareer } from '@ogonggo/api';
import { saveReturnPath } from '@/shared/lib/returnPath';
import type { SignInWithLetsCareerBody } from './authResponses';
import { saveTokens } from './authTokens';
import {
  LetsCareerApiError,
  letsCareerCallbackUri,
  parseLetsCareerRedirect,
  ssoAuthenticate,
} from './letscareer';

/**
 * 일반 회원 로그인의 뒷부분. 렛츠커리어 토큰을 오공고 토큰으로 바꾸고 저장한다.
 *
 * 로그인 화면(이메일 폼), 간편 로그인 콜백, 가입 뒤 이어지는 로그인이 모두 여기를 지난다. 그래서 화면이 아니라
 * `shared` 에 둔다.
 */

/**
 * `signInWithLetsCareer` 로 교환하고 두 토큰을 저장한다. 렛츠커리어 토큰은 여기서 쓰고 버린다.
 *
 * 409 `USER_ALREADY_EXISTS` 는 같은 사용자의 첫 교환이 동시에 두 번 들어와 계정 생성이 겹쳤다는 뜻이고,
 * 다시 보내면 성공한다(PRD "쓰는 API"). 한 번만 다시 보낸다.
 */
export async function exchangeLetsCareerToken(
  letsCareerAccessToken: string,
): Promise<{ isNewUser: boolean }> {
  // 성공 응답이 스펙에 빠져 생성 타입이 오류 응답뿐이다. authResponses.ts 주석에 이유가 있다.
  const exchange = async () =>
    (await signInWithLetsCareer({ letsCareerAccessToken })) as unknown as SignInWithLetsCareerBody;

  let body: SignInWithLetsCareerBody;
  try {
    body = await exchange();
  } catch (error) {
    if (!(error instanceof HttpError && error.status === 409)) {
      throw error;
    }
    body = await exchange();
  }
  saveTokens(body.data);
  return { isNewUser: body.data.isNewUser };
}

/**
 * 렛츠커리어 이메일·비밀번호 로그인에서 교환까지(PRD "흐름 > 일반 회원 이메일 로그인" 1~3).
 *
 * `ssoAuthenticate` 가 준 `redirectUrl` 로 이동하지 않고 그 주소에서 토큰만 읽는다. 이동하면 렛츠커리어 토큰이
 * 주소창과 방문 기록에 남는다. `redirectUri` 는 화이트리스트와 같아야 해서 콜백 주소를 그대로 넘긴다.
 */
export async function signInWithLetsCareerEmail(credentials: {
  email: string;
  password: string;
}): Promise<{ isNewUser: boolean }> {
  const { redirectUrl } = await ssoAuthenticate({
    ...credentials,
    redirectUri: letsCareerCallbackUri(),
  });
  const result = parseLetsCareerRedirect(redirectUrl);
  if (result.kind !== 'token') {
    throw new Error('렛츠커리어 로그인 응답에서 토큰을 읽지 못했습니다.');
  }
  return exchangeLetsCareerToken(result.letsCareerAccessToken);
}

/**
 * 교환 뒤 갈 곳. 오공고 계정이 막 생겼으면(`isNewUser`) 커리어 정보 화면으로 가고, 돌아갈 화면은 그 화면이
 * "다음에 하기"·"입력 완료" 뒤에 쓰도록 `sessionStorage` 에 적어 둔다. 아니면 돌아갈 화면(없으면 홈) 이다.
 */
export function pathAfterLetsCareerSignIn(isNewUser: boolean, returnPath: string | null): string {
  if (isNewUser) {
    saveReturnPath(returnPath);
    return '/signup/career';
  }
  return returnPath ?? '/';
}

/**
 * 일반 회원 로그인이 실패한 까닭. 간편 로그인 콜백이 실패를 로그인 화면으로 넘길 때 `/login?error=` 에 이 값을
 * 싣는다 — 주소창에 문구를 그대로 실으면 누구나 로그인 화면에 아무 문장이나 띄울 수 있다.
 */
export type LetsCareerSignInFailure =
  | 'invalid-credentials'
  | 'redirect-mismatch'
  | 'letscareer-error'
  | 'rejected-token'
  | 'suspended'
  | 'unavailable'
  | 'already-signed-up'
  | 'social-error'
  | 'invalid-callback'
  | 'unknown';

const FAILURE_MESSAGES: Record<LetsCareerSignInFailure, string> = {
  'invalid-credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  // 렛츠커리어 화이트리스트에 이 주소가 없다. 다시 시도해도 같으므로 운영 쪽 문제라고 말한다.
  'redirect-mismatch': '등록되지 않은 주소에서 로그인을 시도했습니다. 고객센터로 문의해 주세요.',
  'letscareer-error': '렛츠커리어 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.',
  'rejected-token': '렛츠커리어 로그인을 확인하지 못했습니다. 다시 로그인해 주세요.',
  suspended: '이용이 정지되었거나 탈퇴한 계정입니다. 고객센터로 문의해 주세요.',
  unavailable: '렛츠커리어에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  'already-signed-up': '이미 다른 방법으로 가입한 계정입니다.',
  'social-error': '간편 로그인에 실패했습니다. 다시 시도해 주세요.',
  'invalid-callback': '로그인 결과를 읽지 못했습니다. 다시 시도해 주세요.',
  unknown: '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
};

/** `?error=` 로 받은 값의 문구. 모르는 값이면 `null` 이다. */
export function letsCareerSignInFailureMessage(failure: string | null | undefined): string | null {
  return failure && Object.hasOwn(FAILURE_MESSAGES, failure)
    ? FAILURE_MESSAGES[failure as LetsCareerSignInFailure]
    : null;
}

/**
 * 던져진 오류를 실패 까닭으로 옮긴다. 렛츠커리어 단계(`LetsCareerApiError`) 와 오공고 교환 단계(`HttpError`) 를
 * 함께 받는다.
 *
 * 교환의 오류는 401 `INVALID_LETSCAREER_TOKEN`, 403 `USER_SUSPENDED`·`USER_WITHDRAWN`, 503
 * `LETSCAREER_UNAVAILABLE` 이다. `HttpError` 가 본문 `code` 를 들고 있지 않아 상태 코드로 가른다.
 */
export function letsCareerSignInFailureOf(error: unknown): LetsCareerSignInFailure {
  if (error instanceof LetsCareerApiError) {
    if (error.code === 'SSO_INVALID_CREDENTIALS') {
      return 'invalid-credentials';
    }
    if (error.code === 'SSO_REDIRECT_URI_MISMATCH') {
      return 'redirect-mismatch';
    }
    if (error.status >= 500) {
      return 'letscareer-error';
    }
  }
  if (error instanceof HttpError) {
    if (error.status === 401) {
      return 'rejected-token';
    }
    if (error.status === 403) {
      return 'suspended';
    }
    if (error.status === 503) {
      return 'unavailable';
    }
  }
  return 'unknown';
}

/** 폼에 보일 한 줄. */
export function letsCareerSignInErrorMessage(error: unknown): string {
  return FAILURE_MESSAGES[letsCareerSignInFailureOf(error)];
}
