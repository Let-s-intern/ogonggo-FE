import { decodeJwt } from 'jose';
import type { Config } from './config.js';
import { authenticateWithLetsCareer } from './letscareer.js';

/**
 * MCP 전용 관리자 계정(서비스 계정)으로 관리자 API 를 부른다(PRD 5-3).
 *
 * 오공고 토큰은 이 함수 인스턴스의 메모리에만 있다. 인스턴스마다 따로 로그인해도 된다 — 새 로그인은
 * 이전 refresh 만 무효로 하고, 이미 발급된 access 는 만료까지 유효하다(BE `authentication.md` 3 절).
 */

/** access 만료가 이만큼 남으면 미리 갱신한다. 요청 도중 만료되는 일을 줄인다. */
const REFRESH_MARGIN_SECONDS = 60;

export class OgonggoApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'OgonggoApiError';
    this.status = status;
    this.code = code;
  }
}

interface Envelope<T> {
  status?: number;
  code?: string;
  message?: string;
  data?: T;
}

async function readEnvelope<T>(response: Response): Promise<Envelope<T>> {
  const text = await response.text().catch(() => '');
  try {
    return JSON.parse(text) as Envelope<T>;
  } catch {
    return { message: text.slice(0, 300) };
  }
}

type ServiceConfig = Pick<
  Config,
  | 'userApiOrigin'
  | 'adminApiOrigin'
  | 'letsCareerApiOrigin'
  | 'letsCareerSsoRedirectUri'
  | 'serviceEmail'
  | 'servicePassword'
>;

interface Tokens {
  accessToken: string;
  refreshToken: string | null;
  /** 초 단위 만료 시각. 읽지 못하면 0 이고, 그때는 401 을 받을 때까지 쓴다. */
  expiresAt: number;
}

function expiresAtOf(accessToken: string): number {
  try {
    return decodeJwt(accessToken).exp ?? 0;
  } catch {
    return 0;
  }
}

export class ServiceAccount {
  #tokens: Tokens | null = null;
  #pending: Promise<Tokens> | null = null;
  readonly #config: ServiceConfig;
  readonly #fetch: typeof fetch;
  readonly #now: () => number;

  constructor(config: ServiceConfig, deps: { fetch?: typeof fetch; now?: () => number } = {}) {
    this.#config = config;
    this.#fetch = deps.fetch ?? fetch;
    this.#now = deps.now ?? (() => Date.now() / 1000);
  }

  /** 쓸 수 있는 access 토큰. 만료가 가까우면 갱신한다. 동시에 불려도 갱신은 한 번만 나간다. */
  async accessToken(): Promise<string> {
    const tokens = this.#tokens;
    if (
      tokens &&
      (tokens.expiresAt === 0 || tokens.expiresAt - this.#now() > REFRESH_MARGIN_SECONDS)
    ) {
      return tokens.accessToken;
    }
    return (await this.#renew()).accessToken;
  }

  /**
   * 관리자 API 가 401 을 준 토큰을 버린다. 다른 요청이 이미 새 토큰을 받았다면 아무것도 하지 않는다.
   * 같은 이유로 `apps/admin/src/shared/api/reissue.ts` 도 보낸 토큰과 지금 토큰을 비교한다.
   */
  invalidate(sentAccessToken: string): void {
    if (this.#tokens?.accessToken === sentAccessToken) {
      this.#tokens = { ...this.#tokens, expiresAt: 1 };
    }
  }

  /** 관리자 API GET. `data` 를 돌려준다. 401 이면 토큰을 한 번 갱신하고 다시 부른다. */
  async get<T = unknown>(path: string, query?: URLSearchParams): Promise<T> {
    const url = `${this.#config.adminApiOrigin}${path}${query?.size ? `?${query}` : ''}`;
    let token = await this.accessToken();
    let response = await this.#adminGet(url, token);
    if (response.status === 401) {
      this.invalidate(token);
      token = await this.accessToken();
      response = await this.#adminGet(url, token);
    }
    const body = await readEnvelope<T>(response);
    if (!response.ok) {
      throw new OgonggoApiError(
        response.status,
        body.code ?? '',
        body.message ?? `GET ${path} failed: ${response.status}`,
      );
    }
    return body.data as T;
  }

  #adminGet(url: string, token: string): Promise<Response> {
    return this.#fetch(url, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
    });
  }

  #renew(): Promise<Tokens> {
    this.#pending ??= this.#reissueOrSignIn().finally(() => {
      this.#pending = null;
    });
    return this.#pending;
  }

  async #reissueOrSignIn(): Promise<Tokens> {
    const refreshToken = this.#tokens?.refreshToken;
    if (refreshToken) {
      const reissued = await this.#reissue(refreshToken).catch(() => null);
      if (reissued) {
        this.#tokens = reissued;
        return reissued;
      }
    }
    const signedIn = await this.#signIn();
    this.#tokens = signedIn;
    return signedIn;
  }

  /** `POST /api/v1/auth/token`. refresh 는 바뀌지 않고 access 만 새로 온다. */
  async #reissue(refreshToken: string): Promise<Tokens | null> {
    const response = await this.#fetch(`${this.#config.userApiOrigin}/api/v1/auth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      return null;
    }
    const body = await readEnvelope<{ accessToken?: string }>(response);
    const accessToken = body.data?.accessToken;
    if (!accessToken) {
      return null;
    }
    return { accessToken, refreshToken, expiresAt: expiresAtOf(accessToken) };
  }

  /** 렛츠커리어 SSO → `POST /api/v1/auth/letscareer`. 관리자 콘솔 로그인과 같은 순서다. */
  async #signIn(): Promise<Tokens> {
    const sso = await authenticateWithLetsCareer(
      { email: this.#config.serviceEmail, password: this.#config.servicePassword },
      {
        apiOrigin: this.#config.letsCareerApiOrigin,
        redirectUri: this.#config.letsCareerSsoRedirectUri,
        fetch: this.#fetch,
      },
    );
    if (sso.ok === false) {
      throw new OgonggoApiError(
        503,
        'SERVICE_ACCOUNT_SIGN_IN_FAILED',
        `서비스 계정 렛츠커리어 로그인 실패: ${sso.detail}`,
      );
    }

    const response = await this.#fetch(`${this.#config.userApiOrigin}/api/v1/auth/letscareer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ letsCareerAccessToken: sso.letsCareerAccessToken }),
    });
    const body = await readEnvelope<{ accessToken?: string; refreshToken?: string }>(response);
    const accessToken = body.data?.accessToken;
    if (!response.ok || !accessToken) {
      throw new OgonggoApiError(
        503,
        'SERVICE_ACCOUNT_SIGN_IN_FAILED',
        `서비스 계정 오공고 토큰 교환 실패: ${response.status} ${body.code ?? ''}`,
      );
    }
    return {
      accessToken,
      refreshToken: body.data?.refreshToken || null,
      expiresAt: expiresAtOf(accessToken),
    };
  }
}
