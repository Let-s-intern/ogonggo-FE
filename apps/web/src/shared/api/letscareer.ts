/**
 * 렛츠커리어 API 를 부르는 작은 클라이언트. 일반 회원의 가입과 로그인이 쓴다.
 *
 * orval 밖에 손으로 쓴다. 렛츠커리어는 오공고 스펙에 없고, 쓰는 것은 API 두 개와 페이지 이동 하나다.
 * 규칙과 형식은 `lets-career-server` origin/main 에서 옮겼고, 각 항목 주석에 그 파일을 적는다.
 *
 * `@ogonggo/api` 의 `httpClient` 를 쓰지 않는다. 그쪽은 오공고 액세스 토큰을 `Authorization` 에 붙이므로,
 * 거기에 렛츠커리어 주소를 넘기면 오공고 토큰이 다른 서비스로 나간다.
 *
 * 브라우저에서만 부른다. `/letscareer-api/**` 는 `next.config.ts` 의 rewrite 가 렛츠커리어로 넘기고,
 * 서버 컴포넌트에는 그 rewrite 가 없다.
 */

const API_PREFIX = '/letscareer-api';

/** 렛츠커리어가 로그인 뒤 돌려보낼 주소의 경로. SSO 화이트리스트에 이 경로 그대로 등록돼 있다. */
export const LETSCAREER_CALLBACK_PATH = '/auth/letscareer/callback';

/**
 * 렛츠커리어 오류 응답 본문. `global/error/entity/ErrorResponse.java`.
 * `code` 는 오류 enum 의 이름이다(`global/error/ErrorCode.java` 의 `getCode`).
 */
interface LetsCareerErrorBody {
  status: number;
  code: string;
  message: string;
}

/** 렛츠커리어 성공 응답 봉투. `global/common/entity/SuccessResponse.java`. */
interface LetsCareerSuccessBody<T> {
  status: number;
  message: string;
  data: T;
}

/**
 * 렛츠커리어가 2xx 가 아닌 응답을 준 경우. 화면은 `code` 로 칸별 오류를 가르고, `message` 는 서버가
 * 한국어로 주므로 그대로 보여도 된다. 본문이 오류 형식이 아니면(게이트웨이 오류 등) `code` 가 비어 있다.
 */
export class LetsCareerApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'LetsCareerApiError';
    this.status = status;
    this.code = code;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = json as Partial<LetsCareerErrorBody> | undefined;
    throw new LetsCareerApiError(
      response.status,
      error?.code ?? '',
      error?.message ?? `POST ${path} failed: ${response.status}`,
    );
  }
  return (json as LetsCareerSuccessBody<T> | undefined)?.data as T;
}

/**
 * 이메일 가입 요청. `domain/user/dto/request/UserPwSignUpRequestDto.java`. 여섯 값 모두 필수다.
 * `inflowPath` 는 "어떻게 알게 됐는지" 칸이고, `marketingAgree` 는 마케팅 수신 동의다.
 */
export interface LetsCareerSignUpRequest {
  email: string;
  name: string;
  phoneNum: string;
  password: string;
  inflowPath: string;
  marketingAgree: boolean;
}

/**
 * 렛츠커리어 이메일 가입. `POST /api/v1/user/signup`(`domain/user/controller/UserV1Controller.java` 의
 * `pwSignUp`). 201 에 토큰이 없으므로 가입 뒤에는 `ssoAuthenticate` 로 따로 로그인한다.
 *
 * 오류 `code`: `USER_EMAIL_CONFLICT`·`USER_PHONE_NUMBER_CONFLICT`(409), `INVALID_EMAIL`·`INVALID_PASSWORD`·
 * `INVALID_PHONE_NUMBER`(400). `domain/user/error/UserErrorCode.java`.
 */
export async function signUp(request: LetsCareerSignUpRequest): Promise<void> {
  await post<null>('/v1/user/signup', request);
}

/** SSO 로그인 요청. `domain/sso/dto/request/SsoAuthenticateRequestDto.java`. */
export interface LetsCareerSsoAuthenticateRequest {
  email: string;
  password: string;
  /** 화이트리스트와 스킴·호스트·포트·경로·쿼리까지 같아야 한다. `letsCareerCallbackUri()` 를 넘긴다. */
  redirectUri: string;
}

/** `domain/sso/dto/response/SsoAuthenticateResponseDto.java`. */
export interface LetsCareerSsoAuthenticateResponse {
  /** `redirectUri?token=...&refreshToken=...`. `domain/sso/service/SsoRedirectUrlBuilder.java`. */
  redirectUrl: string;
}

/**
 * 렛츠커리어 이메일·비밀번호 로그인. `POST /api/v1/sso/authenticate`
 * (`domain/sso/controller/SsoAuthController.java`).
 *
 * 받은 `redirectUrl` 로 이동하지 않고 `parseLetsCareerRedirect` 로 토큰을 꺼낸다. 이동하면 토큰이 주소창과
 * 방문 기록에 남는다.
 *
 * 오류 `code`: `SSO_INVALID_CREDENTIALS`, `SSO_REDIRECT_URI_MISMATCH`(둘 다 400,
 * `domain/sso/error/SsoErrorCode.java`).
 */
export async function ssoAuthenticate(
  request: LetsCareerSsoAuthenticateRequest,
): Promise<LetsCareerSsoAuthenticateResponse> {
  return post<LetsCareerSsoAuthenticateResponse>('/v1/sso/authenticate', request);
}

/**
 * 렛츠커리어가 돌려보낼 주소. 쿼리를 붙이지 않는다 — 화이트리스트 비교가 쿼리까지 같아야 통과한다.
 * 로그인 뒤 돌아갈 화면은 주소가 아니라 `sessionStorage` 에 둔다.
 */
export function letsCareerCallbackUri(): string {
  return `${window.location.origin}${LETSCAREER_CALLBACK_PATH}`;
}

export type LetsCareerSocialProvider = 'kakao' | 'naver';

/**
 * 카카오·네이버 로그인으로 보낼 주소. 페이지 이동이라 rewrite 를 거치지 않고 렛츠커리어로 바로 간다.
 * 경로는 `global/config/WebSecurityConfig.java` 의 `authorizationEndpoint` baseUri(`/oauth2/authorize`) 이고,
 * `redirect_uri` 는 `global/security/oauth2/CookieAuthorizationRequestRepository.java` 가 쿠키에 담았다가
 * `OAuth2AuthenticationSuccessHandler.java` 가 로그인 뒤 그대로 돌려보낸다.
 */
export function buildSocialLoginUrl(
  provider: LetsCareerSocialProvider,
  redirectUri: string,
): string {
  const origin = process.env.NEXT_PUBLIC_LETSCAREER_API_ORIGIN;
  if (!origin) {
    // 조용히 `undefined/oauth2/...` 로 보내면 렛츠커리어가 아니라 우리 404 가 떠서 원인을 찾기 어렵다.
    throw new Error(
      'NEXT_PUBLIC_LETSCAREER_API_ORIGIN 이 비어 있어 간편 로그인 주소를 만들 수 없습니다.',
    );
  }
  return `${origin}/oauth2/authorize/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * 렛츠커리어가 돌려준 주소를 읽은 결과.
 *
 * - `token`: 오공고 `signInWithLetsCareer` 에 넘길 렛츠커리어 액세스 토큰. 리프레시 토큰은 읽지 않는다 —
 *   렛츠커리어 토큰은 교환에만 쓰고 저장하지 않는다.
 * - `already-signed-up`: 같은 휴대폰 번호로 다른 방법(이메일·다른 소셜) 가입이 이미 있다.
 * - `error`: 그 밖에 렛츠커리어가 준 실패. `reason` 은 렛츠커리어가 보낸 문구 그대로다.
 * - `invalid`: 토큰도 오류도 읽을 수 없다(직접 연 주소, 잘린 주소 등).
 */
export type LetsCareerRedirectResult =
  | { kind: 'token'; letsCareerAccessToken: string }
  | { kind: 'already-signed-up' }
  | { kind: 'error'; reason: string }
  | { kind: 'invalid' };

/**
 * 이메일 SSO 의 `redirectUrl` 과 소셜 로그인 콜백 주소를 모두 읽는다. 두 형식이 있다.
 *
 * - 이메일 SSO: `?token=...&refreshToken=...` (`domain/sso/service/SsoRedirectUrlBuilder.java`)
 * - 소셜: `?result={"accessToken","refreshToken","isNew"}` (`OAuth2AuthenticationSuccessHandler.java` 의
 *   `determineTargetUrl`, 값은 `domain/user/dto/response/OAuth2TokenResponseDto.java`)
 *
 * 실패는 `?error=...` 로 온다. 중복 가입은 성공 핸들러가 `objectMapper.writeValueAsString` 으로 적어
 * 따옴표째 `"already_signed_up_user"` 가 오고(`determineTargetUrlException`), 인증 실패는
 * `OAuth2AuthenticationFailureHandler.java` 가 예외 문구를 따옴표 없이 적는다. 둘 다 받는다.
 *
 * `isNew` 는 보지 않는다. 신규 여부는 오공고 교환 응답의 `isNewUser` 가 정한다.
 */
export function parseLetsCareerRedirect(url: string): LetsCareerRedirectResult {
  let params: URLSearchParams;
  try {
    params = new URL(url, 'http://localhost').searchParams;
  } catch {
    return { kind: 'invalid' };
  }

  const error = params.get('error');
  if (error !== null) {
    const reason = unquoteJsonString(error);
    return reason === 'already_signed_up_user'
      ? { kind: 'already-signed-up' }
      : { kind: 'error', reason };
  }

  const token = params.get('token');
  if (token) {
    return { kind: 'token', letsCareerAccessToken: token };
  }

  const result = params.get('result');
  if (result) {
    try {
      const parsed: unknown = JSON.parse(result);
      const accessToken = (parsed as { accessToken?: unknown } | null)?.accessToken;
      if (typeof accessToken === 'string' && accessToken) {
        return { kind: 'token', letsCareerAccessToken: accessToken };
      }
    } catch {
      // 아래 invalid 로 떨어진다.
    }
  }

  return { kind: 'invalid' };
}

function unquoteJsonString(value: string): string {
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'string' ? parsed : value;
  } catch {
    return value;
  }
}
