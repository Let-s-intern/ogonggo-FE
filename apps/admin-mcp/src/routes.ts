import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { StreamableHTTPTransport } from '@hono/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type Config, ConfigError, canUseTool, departmentOf, normalizeEmail } from './config.js';
import { authenticateWithLetsCareer } from './letscareer.js';
import { errorPage, loginPage } from './login-page.js';
import { OgonggoApiError, ServiceAccount } from './ogonggo.js';
import { TOKEN_LIFETIME_SECONDS, signToken, verifyPkce, verifyToken } from './tokens.js';
import { ADMIN_TOOLS, queryOf } from './tools.js';

/**
 * 어드민 MCP 서버. OAuth 2.1 인가 서버(PRD 5-1)와 MCP 엔드포인트(`/mcp`)를 함께 둔다.
 *
 * 테스트가 설정과 `fetch` 를 바꿔 끼울 수 있게 앱을 함수로 만든다. 배포 진입점은 `index.ts` 다.
 */

export interface AppDeps {
  loadConfig: () => Config;
  fetch?: typeof fetch;
  now?: () => number;
  log?: (entry: Record<string, unknown>) => void;
}

const SERVER_INFO = { name: 'ogonggo-admin', version: '0.1.0' };

const INSTRUCTIONS =
  '오공고 관리자 데이터를 조회하는 도구입니다. 모두 읽기 전용이며 관리자 콘솔과 같은 데이터를 돌려줍니다. ' +
  '목록은 page(1부터)·size(최대 100)로 나눠 받고, 응답의 pageInfo.totalElements 가 전체 건수입니다. ' +
  '회원 정보에는 개인정보가 있으니 필요한 만큼만 인용하세요.';

const LOGIN_FAILED =
  '로그인할 수 없습니다. 이메일·비밀번호를 확인하거나, MCP 사용 등록이 되어 있는지 관리자에게 문의하세요.';
const LETSCAREER_UNAVAILABLE =
  '렛츠커리어 로그인 서버에 연결하지 못했습니다. 잠시 후 다시 시도하세요.';

export function createApp(deps: AppDeps) {
  const log = deps.log ?? ((entry) => console.info(JSON.stringify(entry)));
  let config: Config | undefined;
  let serviceAccount: ServiceAccount | undefined;

  const getConfig = () => (config ??= deps.loadConfig());
  const getServiceAccount = () =>
    (serviceAccount ??= new ServiceAccount(getConfig(), { fetch: deps.fetch, now: deps.now }));

  const issuerOf = (c: Context) => getConfig().publicOrigin ?? new URL(c.req.url).origin;
  const resourceOf = (c: Context) => `${issuerOf(c)}/mcp`;

  const app = new Hono();

  app.onError((error, c) => {
    if (error instanceof ConfigError) {
      log({ event: 'config_error', message: error.message });
      return c.json(
        { error: 'server_error', error_description: '서버 설정이 비어 있습니다.' },
        500,
      );
    }
    log({ event: 'unhandled_error', message: String(error) });
    return c.json({ error: 'server_error' }, 500);
  });

  // 브라우저에서 도는 MCP 클라이언트(MCP Inspector 등)를 위해 연다. 토큰을 쿠키가 아닌 헤더로 받으므로 `*` 로 충분하다.
  const apiCors = cors({
    origin: '*',
    allowHeaders: ['authorization', 'content-type', 'mcp-protocol-version', 'mcp-session-id'],
    exposeHeaders: ['www-authenticate', 'mcp-session-id'],
  });
  app.use('/.well-known/*', apiCors);
  app.use('/register', apiCors);
  app.use('/token', apiCors);
  app.use('/mcp', apiCors);

  app.get('/', (c) => c.text('ogonggo admin MCP. Connect your MCP client to /mcp.'));
  app.get('/health', (c) => c.json({ status: 'ok' }));

  // ── 메타데이터 ─────────────────────────────────────────────────────────────

  const protectedResource = (c: Context) =>
    c.json({
      resource: resourceOf(c),
      authorization_servers: [issuerOf(c)],
      bearer_methods_supported: ['header'],
      resource_name: '오공고 어드민',
    });
  app.get('/.well-known/oauth-protected-resource', protectedResource);
  app.get('/.well-known/oauth-protected-resource/mcp', protectedResource);

  app.get('/.well-known/oauth-authorization-server', (c) => {
    const issuer = issuerOf(c);
    return c.json({
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      registration_endpoint: `${issuer}/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      authorization_response_iss_parameter_supported: true,
    });
  });

  // ── 동적 클라이언트 등록 (RFC 7591) ───────────────────────────────────────

  app.post('/register', async (c) => {
    const cfg = getConfig();
    const body = (await c.req.json().catch(() => null)) as {
      redirect_uris?: unknown;
      client_name?: unknown;
    } | null;
    const redirectUris = body?.redirect_uris;
    if (
      !Array.isArray(redirectUris) ||
      redirectUris.length === 0 ||
      !redirectUris.every((uri) => typeof uri === 'string')
    ) {
      return c.json(
        { error: 'invalid_redirect_uri', error_description: 'redirect_uris 가 필요합니다.' },
        400,
      );
    }
    const rejected = redirectUris.filter((uri) => !isAllowedRedirectUri(cfg, uri));
    if (rejected.length > 0) {
      log({ event: 'register_rejected', redirect_uris: rejected });
      return c.json(
        {
          error: 'invalid_redirect_uri',
          error_description: `허용하지 않는 redirect_uri: ${rejected.join(', ')}`,
        },
        400,
      );
    }
    const clientName =
      typeof body?.client_name === 'string' ? body.client_name.slice(0, 100) : undefined;
    const issuer = issuerOf(c);
    const clientId = await signToken(
      cfg.jwtSecret,
      { use: 'client', redirect_uris: redirectUris, client_name: clientName },
      { issuer },
    );
    return c.json(
      {
        client_id: clientId,
        client_id_issued_at: Math.floor(deps.now?.() ?? Date.now() / 1000),
        client_name: clientName,
        redirect_uris: redirectUris,
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      },
      201,
    );
  });

  // ── 인가 ──────────────────────────────────────────────────────────────────

  app.get('/authorize', async (c) => {
    const cfg = getConfig();
    const issuer = issuerOf(c);
    const q = c.req.query();

    // client_id 와 redirect_uri 를 믿을 수 있기 전에는 redirect 하지 않는다(RFC 6749 4.1.2.1).
    const client = q.client_id
      ? await verifyToken(cfg.jwtSecret, q.client_id, 'client', { issuer })
      : null;
    if (!client || !q.client_id) {
      return htmlError(c, '등록되지 않은 클라이언트입니다. 커넥터를 다시 추가해 주세요.');
    }
    const redirectUri =
      q.redirect_uri ?? (client.redirect_uris.length === 1 ? client.redirect_uris[0] : undefined);
    if (
      !redirectUri ||
      !client.redirect_uris.includes(redirectUri) ||
      !isAllowedRedirectUri(cfg, redirectUri)
    ) {
      return htmlError(c, 'redirect_uri 가 등록된 값과 다릅니다.');
    }

    const fail = (error: string, description: string) =>
      c.redirect(
        withParams(redirectUri, {
          error,
          error_description: description,
          state: q.state,
          iss: issuer,
        }),
      );
    if (q.response_type !== 'code') {
      return fail('unsupported_response_type', 'response_type 은 code 만 지원합니다.');
    }
    if (!q.code_challenge || q.code_challenge_method !== 'S256') {
      return fail('invalid_request', 'PKCE(code_challenge, S256) 가 필요합니다.');
    }
    if (q.resource && stripSlash(q.resource) !== resourceOf(c)) {
      return fail('invalid_target', `resource 는 ${resourceOf(c)} 여야 합니다.`);
    }

    const request = await signToken(
      cfg.jwtSecret,
      {
        use: 'authorization_request',
        client_id: q.client_id,
        redirect_uri: redirectUri,
        code_challenge: q.code_challenge,
        state: q.state,
        scope: q.scope,
      },
      { issuer, expiresIn: TOKEN_LIFETIME_SECONDS.authorizationRequest },
    );
    return htmlPage(
      c,
      loginPage({
        request,
        clientHost: new URL(redirectUri).host,
        clientName: client.client_name,
      }),
    );
  });

  app.post('/authorize', async (c) => {
    const cfg = getConfig();
    const issuer = issuerOf(c);
    const form = await c.req.parseBody();
    const requestToken = typeof form.request === 'string' ? form.request : '';
    const email = typeof form.email === 'string' ? normalizeEmail(form.email) : '';
    const password = typeof form.password === 'string' ? form.password : '';

    const request = await verifyToken(cfg.jwtSecret, requestToken, 'authorization_request', {
      issuer,
    });
    if (!request) {
      return htmlError(c, '로그인 요청이 만료되었습니다. Claude 에서 다시 연결해 주세요.');
    }
    const client = await verifyToken(cfg.jwtSecret, request.client_id, 'client', { issuer });
    const relogin = (error: string, status: 400 | 401 | 503) =>
      htmlPage(
        c,
        loginPage({
          request: requestToken,
          clientHost: new URL(request.redirect_uri).host,
          clientName: client?.client_name,
          email,
          error,
        }),
        status,
      );

    if (!email || !password) {
      return relogin('이메일과 비밀번호를 입력하세요.', 400);
    }
    // 목록에 없는 사람은 렛츠커리어를 부르지 않는다. 이 화면이 아무 계정의 비밀번호 확인 창구가 되지 않게 한다.
    const department = departmentOf(cfg.access, email);
    if (!department) {
      log({ event: 'login_rejected', reason: 'not_member' });
      return relogin(LOGIN_FAILED, 401);
    }

    const sso = await authenticateWithLetsCareer(
      { email, password },
      {
        apiOrigin: cfg.letsCareerApiOrigin,
        redirectUri: cfg.letsCareerSsoRedirectUri,
        fetch: deps.fetch,
      },
    );
    if (sso.ok === false) {
      log({ event: 'login_rejected', email, reason: sso.reason, detail: sso.detail });
      return sso.reason === 'invalid_credentials'
        ? relogin(LOGIN_FAILED, 401)
        : relogin(LETSCAREER_UNAVAILABLE, 503);
    }

    const code = await signToken(
      cfg.jwtSecret,
      {
        use: 'authorization_code',
        sub: email,
        client_id: request.client_id,
        redirect_uri: request.redirect_uri,
        code_challenge: request.code_challenge,
        scope: request.scope,
      },
      { issuer, expiresIn: TOKEN_LIFETIME_SECONDS.authorizationCode },
    );
    log({ event: 'login', email, department });
    return c.redirect(
      withParams(request.redirect_uri, { code, state: request.state, iss: issuer }),
      302,
    );
  });

  // ── 토큰 ──────────────────────────────────────────────────────────────────

  app.post('/token', async (c) => {
    const cfg = getConfig();
    const issuer = issuerOf(c);
    const resource = resourceOf(c);
    const form = await readTokenForm(c);
    c.header('cache-control', 'no-store');
    c.header('pragma', 'no-cache');

    const clientId = form.client_id ?? basicClientId(c.req.header('authorization'));
    if (!clientId || !(await verifyToken(cfg.jwtSecret, clientId, 'client', { issuer }))) {
      return c.json({ error: 'invalid_client' }, 401);
    }

    let subject: string;
    let scope: string | undefined;
    if (form.grant_type === 'authorization_code') {
      const code = await verifyToken(cfg.jwtSecret, form.code ?? '', 'authorization_code', {
        issuer,
      });
      if (
        !code ||
        code.client_id !== clientId ||
        (form.redirect_uri !== undefined && form.redirect_uri !== code.redirect_uri) ||
        !(await verifyPkce(form.code_verifier ?? '', code.code_challenge))
      ) {
        return c.json({ error: 'invalid_grant' }, 400);
      }
      subject = code.sub;
      scope = code.scope;
    } else if (form.grant_type === 'refresh_token') {
      const refresh = await verifyToken(cfg.jwtSecret, form.refresh_token ?? '', 'refresh', {
        issuer,
      });
      if (!refresh || refresh.client_id !== clientId) {
        return c.json({ error: 'invalid_grant' }, 400);
      }
      subject = refresh.sub;
      scope = refresh.scope;
    } else {
      return c.json({ error: 'unsupported_grant_type' }, 400);
    }

    // 목록에서 빠진 사람은 refresh 로도 이어 쓰지 못한다(PRD 5-4).
    if (!departmentOf(cfg.access, subject)) {
      log({ event: 'token_rejected', email: subject, reason: 'not_member' });
      return c.json(
        { error: 'invalid_grant', error_description: 'MCP 사용 등록이 없습니다.' },
        400,
      );
    }

    const accessToken = await signToken(
      cfg.jwtSecret,
      { use: 'access', sub: subject, client_id: clientId, scope },
      { issuer, audience: resource, expiresIn: TOKEN_LIFETIME_SECONDS.access },
    );
    const refreshToken = await signToken(
      cfg.jwtSecret,
      { use: 'refresh', sub: subject, client_id: clientId, scope },
      { issuer, expiresIn: TOKEN_LIFETIME_SECONDS.refresh },
    );
    return c.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: TOKEN_LIFETIME_SECONDS.access,
      refresh_token: refreshToken,
      ...(scope ? { scope } : {}),
    });
  });

  // ── MCP ───────────────────────────────────────────────────────────────────

  // 상태 없는 서버라 서버발 SSE 스트림(GET)과 세션 종료(DELETE)를 두지 않는다. 스펙상 405 로 답하면 된다.
  app.on(['GET', 'DELETE'], '/mcp', (c) => {
    c.header('allow', 'POST');
    return c.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null },
      405,
    );
  });

  app.post('/mcp', async (c) => {
    const cfg = getConfig();
    const issuer = issuerOf(c);
    const unauthorized = (description: string) => {
      c.header(
        'www-authenticate',
        `Bearer resource_metadata="${issuer}/.well-known/oauth-protected-resource", error="invalid_token", error_description="${description}"`,
      );
      return c.json({ error: 'invalid_token', error_description: description }, 401);
    };

    const authorization = c.req.header('authorization') ?? '';
    const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      return unauthorized('access token required');
    }
    const claims = await verifyToken(cfg.jwtSecret, token, 'access', {
      issuer,
      audience: resourceOf(c),
    });
    if (!claims) {
      return unauthorized('invalid or expired token');
    }
    const department = departmentOf(cfg.access, claims.sub);
    if (!department) {
      return unauthorized('not a member');
    }

    const server = buildMcpServer({
      email: claims.sub,
      department,
      allowedTools: ADMIN_TOOLS.filter((tool) => canUseTool(cfg.access, claims.sub, tool.name)),
      serviceAccount: getServiceAccount(),
      log,
    });
    const transport = new StreamableHTTPTransport({ enableJsonResponse: true });
    await server.connect(transport);
    return transport.handleRequest(c);
  });

  return app;
}

// ── MCP 서버 ────────────────────────────────────────────────────────────────

function buildMcpServer(options: {
  email: string;
  department: string;
  allowedTools: typeof ADMIN_TOOLS;
  serviceAccount: ServiceAccount;
  log: (entry: Record<string, unknown>) => void;
}): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS });
  for (const tool of options.allowedTools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.input,
        annotations: {
          title: tool.title,
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async (args: Record<string, unknown>) => {
        const startedAt = Date.now();
        try {
          const data = await options.serviceAccount.get(tool.path(args), queryOf(tool, args));
          options.log({
            event: 'tool_call',
            email: options.email,
            department: options.department,
            tool: tool.name,
            status: 200,
            ms: Date.now() - startedAt,
          });
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(data ?? null, null, 2) }],
          };
        } catch (error) {
          const status = error instanceof OgonggoApiError ? error.status : 500;
          options.log({
            event: 'tool_call',
            email: options.email,
            department: options.department,
            tool: tool.name,
            status,
            ms: Date.now() - startedAt,
            error: String(error),
          });
          const message =
            error instanceof OgonggoApiError
              ? `관리자 API 오류 ${error.status}${error.code ? ` ${error.code}` : ''}: ${error.message}`
              : '관리자 API 를 부르지 못했습니다.';
          return { isError: true, content: [{ type: 'text' as const, text: message }] };
        }
      },
    );
  }
  return server;
}

// ── 도우미 ──────────────────────────────────────────────────────────────────

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** 허용 목록에 그대로 있거나, 허용했다면 루프백(`http://localhost:<포트>/...`)인 주소. */
export function isAllowedRedirectUri(
  cfg: Pick<Config, 'redirectUris' | 'allowLoopbackRedirect'>,
  uri: string,
): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.hash || url.username || url.password) {
    return false;
  }
  if (cfg.redirectUris.includes(uri)) {
    return true;
  }
  return cfg.allowLoopbackRedirect && url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname);
}

function withParams(uri: string, params: Record<string, string | undefined>): string {
  const url = new URL(uri);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function stripSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/** 로그인 화면은 다른 사이트 안에 띄우지 못하게 하고 캐시하지 않는다. */
function secureHtmlHeaders(c: Context) {
  c.header('x-frame-options', 'DENY');
  c.header(
    'content-security-policy',
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https: http://localhost:* http://127.0.0.1:*; frame-ancestors 'none'",
  );
  c.header('cache-control', 'no-store');
  c.header('referrer-policy', 'no-referrer');
}

function htmlPage(
  c: Context,
  page: ReturnType<typeof loginPage>,
  status: 200 | 400 | 401 | 503 = 200,
) {
  secureHtmlHeaders(c);
  return c.html(page, status);
}

function htmlError(c: Context, message: string) {
  return htmlPage(c, errorPage(message), 400);
}

type TokenForm = Partial<
  Record<
    'grant_type' | 'code' | 'redirect_uri' | 'client_id' | 'code_verifier' | 'refresh_token',
    string
  >
>;

/** RFC 6749 은 form 인코딩이지만 JSON 으로 보내는 클라이언트도 받는다. */
async function readTokenForm(c: Context): Promise<TokenForm> {
  const contentType = c.req.header('content-type') ?? '';
  const raw: Record<string, unknown> = contentType.includes('application/json')
    ? ((await c.req.json().catch(() => ({}))) as Record<string, unknown>)
    : await c.req.parseBody();
  const form: TokenForm = {};
  for (const key of [
    'grant_type',
    'code',
    'redirect_uri',
    'client_id',
    'code_verifier',
    'refresh_token',
  ] as const) {
    if (typeof raw[key] === 'string') {
      form[key] = raw[key];
    }
  }
  return form;
}

/** `client_secret_basic` 으로 보낸 경우의 client_id. 비밀값은 없으므로 읽지 않는다. */
function basicClientId(header: string | undefined): string | undefined {
  const encoded = header?.match(/^Basic\s+(.+)$/i)?.[1];
  if (!encoded) {
    return undefined;
  }
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    return decodeURIComponent(decoded.split(':')[0] ?? '') || undefined;
  } catch {
    return undefined;
  }
}
