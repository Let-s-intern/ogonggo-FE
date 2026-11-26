/**
 * 환경 변수에서 읽는 설정. 무엇을 넣는지는 `README.md` 의 표에 있다.
 *
 * 모듈을 불러올 때가 아니라 첫 요청에서 읽는다. 빠진 값이 있어도 `/health` 와 메타데이터는 뜨고,
 * 그 값을 쓰는 요청만 500 으로 실패해 원인이 로그에 남는다.
 */

/** 오공고·렛츠커리어 API 오리진의 기본값. `apps/admin/vercel.json` 과 `apps/admin/api/letscareer-sso.ts` 에 있는 값과 같다. */
const DEFAULT_USER_API_ORIGIN = 'https://qi9peez04m.execute-api.ap-northeast-2.amazonaws.com';
const DEFAULT_ADMIN_API_ORIGIN = 'https://p5itn5nbm4.execute-api.ap-northeast-2.amazonaws.com';
const DEFAULT_LETSCAREER_API_ORIGIN = 'https://3ccm7bgq1b.execute-api.ap-northeast-2.amazonaws.com';

/**
 * 렛츠커리어 SSO 화이트리스트에 등록된 주소. 관리자 콘솔의 콜백(`apps/admin/src/shared/api/letscareer.ts`)이다.
 * 콘솔처럼 이 주소로 이동하지 않고 응답에서 토큰만 읽으므로 화이트리스트 통과용 값이다.
 */
const DEFAULT_LETSCAREER_SSO_REDIRECT_URI = 'https://admin.ogonggo.co.kr/auth/letscareer/callback';

/** Claude 웹·데스크톱 커넥터의 OAuth 콜백. */
const DEFAULT_REDIRECT_URIS = [
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback',
];

/** 서명 키 최소 길이. HS256 키는 32바이트 이상이어야 추측할 수 없다. */
const MIN_JWT_SECRET_LENGTH = 32;

/** 모든 tool 을 뜻하는 값. */
export const ALL_TOOLS = '*';

export interface AccessPolicy {
  /** 부서 → 쓸 수 있는 tool 이름. `*` 는 전부. */
  departments: Record<string, string[]>;
  /** 소문자 이메일 → 부서. */
  members: Record<string, string>;
}

export interface Config {
  /** 이 서버의 공개 주소(끝 `/` 없음). 비우면 요청 주소에서 읽는다. */
  publicOrigin: string | undefined;
  jwtSecret: Uint8Array;
  access: AccessPolicy;
  /** DCR 로 등록할 수 있는 redirect URI. */
  redirectUris: string[];
  /** Claude Code 처럼 `http://localhost:<포트>` 로 받는 클라이언트를 허용할지. */
  allowLoopbackRedirect: boolean;
  userApiOrigin: string;
  adminApiOrigin: string;
  letsCareerApiOrigin: string;
  letsCareerSsoRedirectUri: string;
  serviceEmail: string;
  servicePassword: string;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

type Env = Record<string, string | undefined>;

function required(env: Env, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new ConfigError(`환경 변수 ${name} 이 비어 있습니다.`);
  }
  return value;
}

function origin(env: Env, name: string, fallback: string): string {
  return (env[name]?.trim() || fallback).replace(/\/+$/, '');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** `ADMIN_MCP_ACCESS` JSON 을 읽는다. 모양이 틀리면 어디가 틀렸는지 알려준다. */
export function parseAccessPolicy(raw: string): AccessPolicy {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConfigError('ADMIN_MCP_ACCESS 가 JSON 이 아닙니다.');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new ConfigError('ADMIN_MCP_ACCESS 는 { departments, members } 객체여야 합니다.');
  }
  const { departments, members } = parsed as { departments?: unknown; members?: unknown };
  if (typeof departments !== 'object' || departments === null) {
    throw new ConfigError('ADMIN_MCP_ACCESS.departments 가 없습니다.');
  }
  if (typeof members !== 'object' || members === null) {
    throw new ConfigError('ADMIN_MCP_ACCESS.members 가 없습니다.');
  }

  const policy: AccessPolicy = { departments: {}, members: {} };
  for (const [department, tools] of Object.entries(departments)) {
    if (!Array.isArray(tools) || !tools.every((tool) => typeof tool === 'string')) {
      throw new ConfigError(
        `ADMIN_MCP_ACCESS.departments.${department} 는 tool 이름 배열이어야 합니다.`,
      );
    }
    policy.departments[department] = tools;
  }
  for (const [email, department] of Object.entries(members)) {
    if (typeof department !== 'string' || !(department in policy.departments)) {
      throw new ConfigError(`ADMIN_MCP_ACCESS.members.${email} 의 부서가 departments 에 없습니다.`);
    }
    policy.members[normalizeEmail(email)] = department;
  }
  return policy;
}

export function loadConfig(env: Env): Config {
  const secret = required(env, 'ADMIN_MCP_JWT_SECRET');
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new ConfigError(`ADMIN_MCP_JWT_SECRET 은 ${MIN_JWT_SECRET_LENGTH}자 이상이어야 합니다.`);
  }
  const redirectUris = env.ADMIN_MCP_REDIRECT_URIS?.trim()
    ? env.ADMIN_MCP_REDIRECT_URIS.split(',')
        .map((uri) => uri.trim())
        .filter(Boolean)
    : DEFAULT_REDIRECT_URIS;

  return {
    publicOrigin: env.ADMIN_MCP_PUBLIC_ORIGIN?.trim().replace(/\/+$/, '') || undefined,
    jwtSecret: new TextEncoder().encode(secret),
    access: parseAccessPolicy(required(env, 'ADMIN_MCP_ACCESS')),
    redirectUris,
    allowLoopbackRedirect: env.ADMIN_MCP_ALLOW_LOOPBACK_REDIRECT?.trim() !== 'false',
    userApiOrigin: origin(env, 'OGONGGO_USER_API_ORIGIN', DEFAULT_USER_API_ORIGIN),
    adminApiOrigin: origin(env, 'OGONGGO_ADMIN_API_ORIGIN', DEFAULT_ADMIN_API_ORIGIN),
    letsCareerApiOrigin: origin(env, 'LETSCAREER_API_ORIGIN', DEFAULT_LETSCAREER_API_ORIGIN),
    letsCareerSsoRedirectUri:
      env.LETSCAREER_SSO_REDIRECT_URI?.trim() || DEFAULT_LETSCAREER_SSO_REDIRECT_URI,
    serviceEmail: required(env, 'OGONGGO_SERVICE_EMAIL'),
    servicePassword: required(env, 'OGONGGO_SERVICE_PASSWORD'),
  };
}

/** 이메일의 부서. 목록에 없으면 `undefined`. */
export function departmentOf(policy: AccessPolicy, email: string): string | undefined {
  return policy.members[normalizeEmail(email)];
}

/** 이 이메일이 쓸 수 있는 tool 인지. 목록에 없는 사람은 아무것도 못 쓴다. */
export function canUseTool(policy: AccessPolicy, email: string, tool: string): boolean {
  const department = departmentOf(policy, email);
  if (!department) {
    return false;
  }
  const tools = policy.departments[department] ?? [];
  return tools.includes(ALL_TOOLS) || tools.includes(tool);
}
