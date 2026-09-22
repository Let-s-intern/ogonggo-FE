/**
 * 렛츠커리어 통합로그인(SSO) 을 부르는 작은 클라이언트. 관리자 로그인이 쓴다.
 *
 * `@ogonggo/api` 의 `httpClient` 를 쓰지 않는다. 그쪽은 오공고 액세스 토큰을 `Authorization` 에 붙이므로,
 * 거기에 렛츠커리어 주소를 넘기면 오공고 토큰이 다른 서비스로 나간다.
 *
 * `apps/web/src/shared/api/letscareer.ts` 가 같은 서버를 부르지만 파일을 따로 둔다. 근거는
 * `.claude/tasks/memos/결정-어드민-렛츠커리어-클라이언트-위치-2026-09-22.md` 에 적었다.
 *
 * `/letscareer-api/**` 는 dev 에서 `vite.config.ts` 의 프록시가, 배포본에서 `vercel.json` 의 rewrite 가
 * 부르는 서버리스 함수(`api/letscareer-sso.ts`) 가 렛츠커리어로 넘긴다. 양쪽 다 브라우저가 붙인 `Origin`
 * 을 떼고 보낸다 — 떼지 않으면 렛츠커리어가 403 `Invalid CORS request` 로 막는다.
 */

const API_PREFIX = '/letscareer-api';

/** 렛츠커리어가 로그인 뒤 돌려보낼 주소의 경로. SSO 화이트리스트에 이 경로 그대로 등록한다. */
export const LETSCAREER_CALLBACK_PATH = '/auth/letscareer/callback';

/** 렛츠커리어 오류 응답 본문. `code` 는 오류 enum 의 이름이다. */
interface LetsCareerErrorBody {
  status: number;
  code: string;
  message: string;
}

/** 렛츠커리어 성공 응답 봉투. */
interface LetsCareerSuccessBody<T> {
  status: number;
  message: string;
  data: T;
}

/**
 * 렛츠커리어가 2xx 가 아닌 응답을 준 경우. 로그인 화면은 `code` 로 실패 문구를 가른다. 본문이 오류 형식이
 * 아니면(게이트웨이 오류 등) `code` 가 비어 있다.
 */
export class LetsCareerApiError extends Error {
  readonly status: number;
  readonly code: string;
  /**
   * 받은 본문 그대로. `''` 은 읽지 못했다는 뜻이다.
   *
   * `code` 만으로는 부족하다. 렛츠커리어 앞단이 우리 JSON 오류가 아닌 평문으로 막는 경우가 있고
   * (허용 목록에 없는 `Origin` 을 막는 403 `Invalid CORS request`), 그때는 `code` 가 비어 있어
   * 상태 코드만 남는다. `HttpError.body`(`packages/api/src/lib/http-client.ts`) 와 같은 이유다.
   */
  readonly body: string;

  constructor(status: number, code: string, message: string, body = '') {
    super(message);
    this.name = 'LetsCareerApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text().catch(() => '');
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    // JSON 이 아닌 본문이다. 위 `body` 주석의 경우이고, 그대로 들고 간다.
  }

  if (!response.ok) {
    const error = json as Partial<LetsCareerErrorBody> | undefined;
    throw new LetsCareerApiError(
      response.status,
      error?.code ?? '',
      error?.message ?? `POST ${path} failed: ${response.status}`,
      text,
    );
  }
  return (json as LetsCareerSuccessBody<T> | undefined)?.data as T;
}

/** SSO 로그인 요청. */
export interface LetsCareerSsoAuthenticateRequest {
  email: string;
  password: string;
  /** 화이트리스트와 스킴·호스트·포트·경로·쿼리까지 같아야 한다. `letsCareerCallbackUri()` 를 넘긴다. */
  redirectUri: string;
}

export interface LetsCareerSsoAuthenticateResponse {
  /** `redirectUri?token=...&refreshToken=...` */
  redirectUrl: string;
}

/**
 * 렛츠커리어 이메일·비밀번호 로그인. `POST /api/v1/sso/authenticate`.
 *
 * 받은 `redirectUrl` 로 이동하지 않고 `letsCareerTokenFrom` 으로 토큰만 꺼낸다. 이동하면 토큰이 주소창과
 * 방문 기록에 남는다.
 *
 * 오류 `code`: `SSO_INVALID_CREDENTIALS`, `SSO_REDIRECT_URI_MISMATCH`(둘 다 400).
 */
export async function ssoAuthenticate(
  request: LetsCareerSsoAuthenticateRequest,
): Promise<LetsCareerSsoAuthenticateResponse> {
  return post<LetsCareerSsoAuthenticateResponse>('/v1/sso/authenticate', request);
}

/**
 * 렛츠커리어가 돌려보낼 주소. 쿼리를 붙이지 않는다 — 화이트리스트 비교가 쿼리까지 같아야 통과한다.
 *
 * 어드민에는 이 경로의 화면이 없다. 이메일·비밀번호 SSO 는 이동하지 않고 응답에서 토큰만 읽으므로,
 * 주소는 화이트리스트와 맞추기 위한 값일 뿐이다. 간편 로그인(카카오·네이버) 은 어드민에 두지 않는다.
 */
export function letsCareerCallbackUri(): string {
  return `${window.location.origin}${LETSCAREER_CALLBACK_PATH}`;
}

/** `redirectUrl` 의 `token`. 읽을 수 없으면 `null` 이다. 리프레시 토큰은 읽지 않는다 — 교환에만 쓰고 버린다. */
export function letsCareerTokenFrom(redirectUrl: string): string | null {
  try {
    return new URL(redirectUrl, window.location.origin).searchParams.get('token');
  } catch {
    return null;
  }
}
