/**
 * Orval's fetch mutator target (see orval.config.ts): generated hooks build the
 * full URL themselves (query params baked in via URLSearchParams) and call this
 * with (url, init), so it takes the same two args a plain `fetch` call would.
 *
 * No base URL in the browser — each app's dev server proxies /api/** to its own
 * backend (apps/web: next.config.ts rewrites, apps/admin: vite.config.ts
 * server.proxy), so this stays free of bundler-specific env var access there
 * (Next reads process.env, Vite reads import.meta.env — this file can't assume
 * either from a browser bundle).
 *
 * Outside the browser (`typeof window === 'undefined'` — Next.js Server
 * Components) there is no such proxy: Node's `fetch` requires an absolute URL,
 * unlike the browser's (verified 2026-08-31: `node -e "fetch('/x')"` throws
 * `TypeError: Failed to parse URL from /x` — and Next's own fetch extension in
 * node_modules/next/dist/server/lib/patch-fetch.js hits the same parse before
 * it ever reaches a passed-through fetch, so a global-fetch monkeypatch in
 * apps/web can't fix it after the fact; the URL has to be absolute here, at
 * the call site). `process.env` is safe to read in that branch since it only
 * runs in Node. `OGONGGO_USER_API_ORIGIN` matches next.config.ts's rewrite
 * target so the two agree without a second env var.
 */
/**
 * A non-2xx response. `status` lets a screen tell 401 (not logged in) from 403
 * (logged in, wrong role) without parsing text. The message keeps the older
 * `"<METHOD> <url> failed: <status>"` shape because apps/web detail views still
 * match on its `: 404` suffix.
 */
export class HttpError extends Error {
  readonly status: number;
  /**
   * The raw response body, `''` when it could not be read. Two 403s can mean
   * different things: the backend's JSON error (`{ code, message }`) or
   * Spring's plain-text `Invalid CORS request`, which never reaches our code.
   * The status alone cannot tell them apart.
   */
  readonly body: string;

  constructor(message: string, status: number, body = '') {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

type AccessTokenProvider = () => string | null | undefined;

let getAccessToken: AccessTokenProvider = () => undefined;

/**
 * Where the `Authorization: Bearer` token comes from. Each app that has a
 * login registers this once at startup (apps/admin: main.tsx, apps/web:
 * app/providers.tsx); this file does not know where a token is stored, for the
 * same reason it does not read env vars. With nothing registered no header is
 * sent. apps/web's provider reads browser storage and returns null on the
 * server, so its Server Components still send no header and no module-level
 * value can leak between server requests.
 */
export function setAccessTokenProvider(provider: AccessTokenProvider): void {
  getAccessToken = provider;
}

/**
 * Called when a request comes back 401, with the request's own `url` and the
 * access token it carried. Resolving `true` means "a new token is in place" and
 * the request is sent once more with whatever the provider returns now; a
 * second 401 is thrown like any other error. Resolving `false` throws the 401
 * straight away.
 */
type UnauthorizedHandler = (url: string, sentAccessToken: string | null) => Promise<boolean>;

let handleUnauthorized: UnauthorizedHandler | undefined;

/**
 * Registered by an app that can renew its token (apps/web reissues with its
 * refresh token). Where the refresh token lives and which endpoint renews it
 * stay in the app, for the same reason the token provider does. With nothing
 * registered a 401 is thrown as before — apps/admin keeps no refresh token and
 * sends a 401 to its login screen instead.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  handleUnauthorized = handler;
}

export async function httpClient<T>(url: string, init: RequestInit = {}): Promise<T> {
  const isRelative = !/^https?:\/\//.test(url);
  const resolvedUrl =
    typeof window === 'undefined' && isRelative
      ? `${process.env.OGONGGO_USER_API_ORIGIN ?? 'http://localhost:8080'}${url}`
      : url;
  /*
   * A FormData body sets its own `multipart/form-data; boundary=...` header,
   * and the boundary is generated per body — it cannot be written by hand.
   * Sending the JSON default over it leaves the server with a multipart body
   * labelled as JSON, which is how `createImage` (POST /api/v1/images, the one
   * multipart endpoint) fails with nothing in the request looking wrong.
   */
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const send = (accessToken: string | null | undefined) =>
    fetch(resolvedUrl, {
      ...init,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    });

  const accessToken = getAccessToken();
  let response = await send(accessToken);
  if (
    response.status === 401 &&
    handleUnauthorized &&
    (await handleUnauthorized(url, accessToken ?? null))
  ) {
    response = await send(getAccessToken());
  }

  if (!response.ok) {
    throw new HttpError(
      `${init.method ?? 'GET'} ${url} failed: ${response.status}`,
      response.status,
      await response.text().catch(() => ''),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
