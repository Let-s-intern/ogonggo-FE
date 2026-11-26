import { createHash, randomBytes } from 'node:crypto';
import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp, isAllowedRedirectUri } from './routes.js';
import { type Config, parseAccessPolicy } from './config.js';

const ORIGIN = 'https://admin-mcp.test';
const CLAUDE_CALLBACK = 'https://claude.ai/api/mcp/auth_callback';
const LC = 'https://lc.test';
const USER_API = 'https://user-api.test';
const ADMIN_API = 'https://admin-api.test';

const config: Config = {
  publicOrigin: ORIGIN,
  jwtSecret: new TextEncoder().encode('x'.repeat(48)),
  access: parseAccessPolicy(
    JSON.stringify({
      departments: { 운영: ['*'], 영업: ['get_advertisement_inquiry_today_count'] },
      members: { 'Ops@Example.com': '운영', 'sales@example.com': '영업' },
    }),
  ),
  redirectUris: [CLAUDE_CALLBACK],
  allowLoopbackRedirect: true,
  userApiOrigin: USER_API,
  adminApiOrigin: ADMIN_API,
  letsCareerApiOrigin: LC,
  letsCareerSsoRedirectUri: 'https://admin.ogonggo.co.kr/auth/letscareer/callback',
  serviceEmail: 'bot@example.com',
  servicePassword: 'bot-password',
};

const PASSWORDS: Record<string, string> = {
  'ops@example.com': 'ops-password',
  'sales@example.com': 'sales-password',
  'bot@example.com': 'bot-password',
  'outsider@example.com': 'outsider-password',
};

interface Call {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

/** 렛츠커리어 SSO, 사용자 API 로그인·재발급, 관리자 API 를 흉내 낸다. */
function fakeBackend() {
  const calls: Call[] = [];
  let issued = 0;
  /** 관리자 API 가 받아 주는 OG access. 새로 로그인하거나 재발급하면 바뀐다. */
  let validAccess = '';

  const ogAccess = async () => {
    issued += 1;
    validAccess = await new SignJWT({ n: issued })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30m')
      .sign(new TextEncoder().encode('og-secret-og-secret-og-secret-og'));
    return validAccess;
  };

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    const headers = Object.fromEntries(new Headers(init?.headers).entries());
    const body = typeof init?.body === 'string' ? init.body : '';
    calls.push({ method: init?.method ?? 'GET', url, headers, body });

    if (url === `${LC}/api/v1/sso/authenticate`) {
      const { email, password } = JSON.parse(body);
      if (PASSWORDS[email] !== password) {
        return Response.json(
          { status: 400, code: 'SSO_INVALID_CREDENTIALS', message: 'x' },
          { status: 400 },
        );
      }
      return Response.json({
        data: { redirectUrl: `https://admin.ogonggo.co.kr/cb?token=lc-${email}&refreshToken=r` },
      });
    }
    if (url === `${USER_API}/api/v1/auth/letscareer`) {
      return Response.json({
        data: { accessToken: await ogAccess(), refreshToken: 'og-refresh', isNewUser: false },
      });
    }
    if (url === `${USER_API}/api/v1/auth/token`) {
      return Response.json({ data: { accessToken: await ogAccess() } });
    }
    if (url.startsWith(`${ADMIN_API}/api/v1/admin/`)) {
      if (headers.authorization !== `Bearer ${validAccess}`) {
        return Response.json({ code: 'UNAUTHORIZED', message: 'x' }, { status: 401 });
      }
      return Response.json({ status: 200, message: 'ok', data: { url } });
    }
    return new Response('not found', { status: 404 });
  };

  return {
    fetch: fetchImpl,
    calls,
    /** 관리자 API 가 지금 토큰을 거부하게 만든다(다른 곳에서 다시 로그인한 상황). */
    expireAccess: () => {
      validAccess = 'revoked';
    },
  };
}

function pkce() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

let backend: ReturnType<typeof fakeBackend>;
let logs: Record<string, unknown>[];
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  backend = fakeBackend();
  logs = [];
  app = createApp({
    loadConfig: () => config,
    fetch: backend.fetch,
    log: (entry) => logs.push(entry),
  });
});

const request = (path: string, init?: RequestInit) => app.request(`${ORIGIN}${path}`, init);

async function register(redirectUris = [CLAUDE_CALLBACK]) {
  const response = await request('/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ redirect_uris: redirectUris, client_name: 'Claude' }),
  });
  return { response, body: (await response.json()) as { client_id: string } };
}

/** 등록 → 로그인 화면 → 로그인 → 인가 코드. */
async function authorize(email: string, password: string) {
  const { body: client } = await register();
  const { verifier, challenge } = pkce();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: client.client_id,
    redirect_uri: CLAUDE_CALLBACK,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: 'state-1',
    resource: `${ORIGIN}/mcp`,
  });
  const page = await request(`/authorize?${params}`);
  const html = await page.text();
  const requestToken = html.match(/name="request" value="([^"]+)"/)?.[1] ?? '';
  const login = await request('/authorize', {
    method: 'POST',
    body: new URLSearchParams({ request: requestToken, email, password }),
  });
  const location = login.headers.get('location');
  const code = location ? new URL(location).searchParams.get('code') : null;
  return { client, verifier, page, html, login, location, code };
}

async function exchange(clientId: string, form: Record<string, string>) {
  const response = await request('/token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: clientId, ...form }),
  });
  return { response, body: (await response.json()) as Record<string, string> };
}

async function signIn(email = 'ops@example.com', password = 'ops-password') {
  const flow = await authorize(email, password);
  const { body } = await exchange(flow.client.client_id, {
    grant_type: 'authorization_code',
    code: flow.code ?? '',
    code_verifier: flow.verifier,
    redirect_uri: CLAUDE_CALLBACK,
  });
  return { ...flow, tokens: body };
}

async function mcp(accessToken: string | undefined, message: object) {
  const response = await request('/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, ...message }),
  });
  return response;
}

describe('메타데이터', () => {
  it('보호 리소스와 인가 서버 메타데이터를 공개 주소로 알린다', async () => {
    const resource = await (await request('/.well-known/oauth-protected-resource')).json();
    expect(resource).toMatchObject({ resource: `${ORIGIN}/mcp`, authorization_servers: [ORIGIN] });

    const server = await (await request('/.well-known/oauth-authorization-server')).json();
    expect(server).toMatchObject({
      issuer: ORIGIN,
      authorization_endpoint: `${ORIGIN}/authorize`,
      token_endpoint: `${ORIGIN}/token`,
      registration_endpoint: `${ORIGIN}/register`,
      code_challenge_methods_supported: ['S256'],
    });
  });

  it('토큰 없이 /mcp 를 부르면 401 과 리소스 메타데이터 위치를 준다', async () => {
    const response = await mcp(undefined, { method: 'tools/list' });
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain(
      `resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource"`,
    );
  });
});

describe('클라이언트 등록', () => {
  it('허용 목록에 없는 redirect_uri 는 등록하지 않는다', async () => {
    const { response } = await register(['https://evil.example/callback']);
    expect(response.status).toBe(400);
  });

  it('Claude 콜백과 루프백은 등록한다', async () => {
    expect((await register()).response.status).toBe(201);
    expect((await register(['http://localhost:53123/callback'])).response.status).toBe(201);
  });

  it('루프백을 끄면 localhost 를 거부한다', () => {
    const cfg = { redirectUris: [CLAUDE_CALLBACK], allowLoopbackRedirect: false };
    expect(isAllowedRedirectUri(cfg, 'http://localhost:1234/cb')).toBe(false);
    expect(isAllowedRedirectUri(cfg, CLAUDE_CALLBACK)).toBe(true);
    expect(isAllowedRedirectUri(cfg, `${CLAUDE_CALLBACK}#x`)).toBe(false);
  });
});

describe('로그인', () => {
  it('허용된 관리자는 렛츠커리어 비밀번호로 로그인해 인가 코드를 받는다', async () => {
    const flow = await authorize('Ops@Example.com ', 'ops-password');
    expect(flow.page.headers.get('x-frame-options')).toBe('DENY');
    expect(flow.login.status).toBe(302);
    expect(flow.location).toMatch(/^https:\/\/claude\.ai\/api\/mcp\/auth_callback\?/);
    const params = new URL(flow.location ?? '').searchParams;
    expect(params.get('state')).toBe('state-1');
    expect(params.get('iss')).toBe(ORIGIN);
    expect(flow.code).toBeTruthy();
  });

  it('사람 확인은 SSO 만 부르고 오공고 토큰 교환은 하지 않는다(콘솔 세션 보존)', async () => {
    await authorize('ops@example.com', 'ops-password');
    expect(backend.calls.map((call) => call.url)).toEqual([`${LC}/api/v1/sso/authenticate`]);
  });

  it('로그인 화면은 클라이언트 이름과 입력값을 이스케이프한다', async () => {
    const response = await request('/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        redirect_uris: [CLAUDE_CALLBACK],
        client_name: '<script>alert(1)</script>',
      }),
    });
    const client = (await response.json()) as { client_id: string };
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: CLAUDE_CALLBACK,
      code_challenge: pkce().challenge,
      code_challenge_method: 'S256',
    });
    const html = await (await request(`/authorize?${params}`)).text();
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain("'Apple SD Gothic Neo'");
  });

  it('비밀번호가 틀리면 다시 로그인 화면을 보인다', async () => {
    const flow = await authorize('ops@example.com', 'wrong');
    expect(flow.login.status).toBe(401);
    expect(await flow.login.text()).toContain('로그인할 수 없습니다');
  });

  it('허용 목록에 없는 이메일은 렛츠커리어를 부르지 않고 같은 문구로 거부한다', async () => {
    const flow = await authorize('outsider@example.com', 'outsider-password');
    expect(flow.login.status).toBe(401);
    expect(await flow.login.text()).toContain('로그인할 수 없습니다');
    expect(backend.calls).toHaveLength(0);
  });

  it('등록할 때와 다른 redirect_uri 로는 로그인 화면을 열지 않는다', async () => {
    const { body: client } = await register();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: 'http://localhost:9999/cb',
      code_challenge: pkce().challenge,
      code_challenge_method: 'S256',
    });
    const response = await request(`/authorize?${params}`);
    expect(response.status).toBe(400);
    expect(response.headers.get('location')).toBeNull();
  });

  it('PKCE 가 없으면 오류와 함께 돌려보낸다', async () => {
    const { body: client } = await register();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: CLAUDE_CALLBACK,
      state: 's',
    });
    const response = await request(`/authorize?${params}`);
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('location') ?? '');
    expect(location.searchParams.get('error')).toBe('invalid_request');
    expect(location.searchParams.get('state')).toBe('s');
  });
});

describe('토큰', () => {
  it('PKCE verifier 가 틀리면 코드를 바꿔 주지 않는다', async () => {
    const flow = await authorize('ops@example.com', 'ops-password');
    const { response, body } = await exchange(flow.client.client_id, {
      grant_type: 'authorization_code',
      code: flow.code ?? '',
      code_verifier: pkce().verifier,
    });
    expect(response.status).toBe(400);
    expect(body.error).toBe('invalid_grant');
  });

  it('다른 클라이언트의 코드는 쓸 수 없다', async () => {
    const flow = await authorize('ops@example.com', 'ops-password');
    const { body: other } = await register();
    const { response } = await exchange(other.client_id, {
      grant_type: 'authorization_code',
      code: flow.code ?? '',
      code_verifier: flow.verifier,
    });
    expect(response.status).toBe(400);
  });

  it('access 토큰을 refresh 자리에 넣을 수 없다', async () => {
    const { client, tokens } = await signIn();
    const { response } = await exchange(client.client_id, {
      grant_type: 'refresh_token',
      refresh_token: tokens.access_token ?? '',
    });
    expect(response.status).toBe(400);
  });

  it('refresh 토큰으로 새 access 를 받는다', async () => {
    const { client, tokens } = await signIn();
    expect(tokens.token_type).toBe('Bearer');
    const { response, body } = await exchange(client.client_id, {
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token ?? '',
    });
    expect(response.status).toBe(200);
    expect(body.access_token).toBeTruthy();
  });
});

describe('MCP', () => {
  it('부서에 허용된 tool 만 보인다', async () => {
    const ops = await signIn();
    const opsList = await (await mcp(ops.tokens.access_token, { method: 'tools/list' })).json();
    expect(opsList.result.tools.length).toBeGreaterThan(10);
    expect(
      opsList.result.tools.every(
        (tool: { annotations: { readOnlyHint: boolean } }) => tool.annotations.readOnlyHint,
      ),
    ).toBe(true);

    const sales = await signIn('sales@example.com', 'sales-password');
    const salesList = await (await mcp(sales.tokens.access_token, { method: 'tools/list' })).json();
    expect(salesList.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      'get_advertisement_inquiry_today_count',
    ]);
  });

  it('tool 을 부르면 서비스 계정 토큰으로 관리자 API 를 부르고 data 를 돌려준다', async () => {
    const { tokens } = await signIn();
    backend.calls.length = 0;
    const response = await mcp(tokens.access_token, {
      method: 'tools/call',
      params: {
        name: 'list_advertisement_inquiries',
        arguments: { page: 2, status: ['RECEIVED', 'CONTACTED'], createdFrom: '2026-11-01' },
      },
    });
    const body = await response.json();
    expect(body.result.isError).toBeFalsy();
    expect(JSON.parse(body.result.content[0].text)).toEqual({
      url: `${ADMIN_API}/api/v1/admin/advertisement-inquiries?page=2&status=RECEIVED&status=CONTACTED&createdFrom=2026-11-01`,
    });

    const urls = backend.calls.map((call) => call.url);
    expect(urls[0]).toBe(`${LC}/api/v1/sso/authenticate`);
    expect(JSON.parse(backend.calls[0]?.body ?? '{}').email).toBe('bot@example.com');
    expect(urls[1]).toBe(`${USER_API}/api/v1/auth/letscareer`);
    expect(logs).toContainEqual(
      expect.objectContaining({
        event: 'tool_call',
        email: 'ops@example.com',
        tool: 'list_advertisement_inquiries',
        status: 200,
      }),
    );
  });

  it('서비스 계정 토큰은 다음 호출에 다시 쓴다', async () => {
    const { tokens } = await signIn();
    const call = { method: 'tools/call', params: { name: 'list_today_jobs', arguments: {} } };
    await mcp(tokens.access_token, call);
    await mcp(tokens.access_token, call);
    const signIns = backend.calls.filter((c) => c.url === `${USER_API}/api/v1/auth/letscareer`);
    expect(signIns).toHaveLength(1);
  });

  it('관리자 API 가 401 을 주면 재발급하고 한 번 더 부른다', async () => {
    const { tokens } = await signIn();
    const call = { method: 'tools/call', params: { name: 'get_job', arguments: { jobId: 7 } } };
    await mcp(tokens.access_token, call);
    backend.expireAccess();
    const body = await (await mcp(tokens.access_token, call)).json();
    expect(body.result.isError).toBeFalsy();
    expect(JSON.parse(body.result.content[0].text).url).toBe(`${ADMIN_API}/api/v1/admin/jobs/7`);
    expect(backend.calls.some((c) => c.url === `${USER_API}/api/v1/auth/token`)).toBe(true);
  });

  it('허용되지 않은 tool 은 부를 수 없다', async () => {
    const { tokens } = await signIn('sales@example.com', 'sales-password');
    const body = await (
      await mcp(tokens.access_token, {
        method: 'tools/call',
        params: { name: 'list_general_members', arguments: {} },
      })
    ).json();
    expect(body.error ?? body.result?.isError).toBeTruthy();
    expect(backend.calls.some((c) => c.url.includes('/general-members'))).toBe(false);
  });

  it('허용 목록에서 빠지면 가지고 있던 토큰도 거부한다', async () => {
    const { tokens } = await signIn();
    const removed = createApp({
      loadConfig: () => ({
        ...config,
        access: parseAccessPolicy(JSON.stringify({ departments: { 운영: ['*'] }, members: {} })),
      }),
      fetch: backend.fetch,
      log: () => {},
    });
    const response = await removed.request(`${ORIGIN}/mcp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        authorization: `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    expect(response.status).toBe(401);
  });

  it('GET /mcp 는 405 로 답한다(상태 없는 서버)', async () => {
    const response = await request('/mcp');
    expect(response.status).toBe(405);
  });
});
