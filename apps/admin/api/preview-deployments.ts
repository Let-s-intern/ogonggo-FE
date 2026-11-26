/**
 * 웹·어드민·비즈니스 세 앱의 프리뷰 또는 운영 배포를 합쳐 최신순으로 10건씩 돌려주는 서버리스 함수. 어드민
 * 배포본의 `GET /preview-api/deployments` 가 `vercel.json` 의 rewrite 로 여기에 들어온다(쿼리 문자열도 그대로
 * 넘어간다). `프리뷰 배포` 화면이 쓴다.
 *
 * 쿼리: `target`(`preview`|`production`, 기본 `preview`), `app`(`all`|`web`|`admin`|`business`, 기본 `all`),
 * `cursor`(앞 응답의 `nextCursor`, 양의 정수 ms. 없으면 첫 페이지). 값이 있는데 틀리면 400 이다. 조용히 기본값으로
 * 바꾸면 화면이 엉뚱한 목록을 보여주고도 원인을 알 수 없다.
 *
 * Vercel REST API 를 이 함수가 대신 부른다. 토큰(`VERCEL_API_TOKEN`)이 브라우저에 나가지 않게 하려는 것이다.
 * 프리뷰 로그인 보호를 껐으므로 주소를 아는 누구나 이 함수를 부를 수 있다. 그래서 호출자가 어드민 토큰인지
 * 먼저 본다(`redash-query.ts` 의 `isAdmin`). 환경변수 확인은 그 뒤다. 순서가 바뀌면 로그인하지 않은 사람에게
 * 토큰 설정 여부가 드러난다.
 *
 * 토큰 값은 응답과 로그 어디에도 싣지 않는다. 상류가 실패하면 앱 이름과 상태 코드만 남긴다.
 */

import { isAdmin } from './redash-query.js';

const VERCEL_API_ORIGIN = 'https://api.vercel.com';
const TEAM_ID = 'team_WtIoqusbcWgwHaefVdZv9bZ9';

export type PreviewApp = 'web' | 'admin' | 'business';

const PROJECTS: { app: PreviewApp; projectId: string }[] = [
  { app: 'admin', projectId: 'prj_oP8isOqPtsl5QVzDlr7RwCLJDFv5' },
  { app: 'web', projectId: 'prj_sK6iiWITGOipl3BK8DZXKjpTPNNs' },
  { app: 'business', projectId: 'prj_kgT2n42EHK7y8AX9qPtAvw3SBghC' },
];

/**
 * 한 페이지 건수이자 프로젝트마다 가져오는 건수. 프로젝트별 앞 10건이면 합친 앞 10건이 정확하다(합친 상위 10건은
 * 어느 프로젝트에서든 그 프로젝트의 상위 10건 안에 있다).
 */
const PAGE_SIZE = 10;
/**
 * 상류에서 `CANCELED` 를 뺀다. 운영 배포는 어드민을 건드리지 않은 커밋에서 빌드를 건너뛰어 취소로 쌓이는데, 페이징
 * 과 함께 두면 페이지마다 보이는 건수가 달라진다.
 */
const UPSTREAM_STATES = 'BUILDING,ERROR,INITIALIZING,QUEUED,READY';
/** 느린 프로젝트 하나가 함수 전체를 붙잡지 않게 한다. */
const UPSTREAM_TIMEOUT_MS = 8_000;

const STATES = ['READY', 'BUILDING', 'QUEUED', 'INITIALIZING', 'ERROR', 'CANCELED'] as const;
export type PreviewState = (typeof STATES)[number];

export interface PreviewDeployment {
  app: PreviewApp;
  id: string;
  /** `https://` 를 붙인 배포 고유 주소. */
  url: string;
  /**
   * 브랜치 별칭 주소. 목록 응답이 별칭을 주지 않아 항상 `null` 이다. 별칭 규칙(한글 제거, 63자 제한)을 코드가
   * 흉내 내면 틀리므로 앱 이름과 브랜치로 만들지 않는다.
   */
  branchAliasUrl: string | null;
  branch: string | null;
  /** 커밋 메시지의 첫 줄. */
  commitTitle: string | null;
  state: PreviewState;
  /** ISO 8601. */
  createdAt: string;
}

export type PreviewTarget = 'preview' | 'production';
export type PreviewAppFilter = PreviewApp | 'all';

export interface PreviewDeploymentsQuery {
  target: PreviewTarget;
  app: PreviewAppFilter;
  /** 이 시각(ms) 이전에 만든 배포만 본다. 없으면 첫 페이지. */
  cursor: number | null;
}

export interface PreviewDeploymentsResult {
  /** 최대 10건. */
  deployments: PreviewDeployment[];
  /** 다음 페이지를 받을 `cursor`(마지막 항목의 `created`, ms). 더 없으면 `null`. */
  nextCursor: number | null;
  /** 불러오지 못한 앱. 나머지 앱의 배포는 그대로 들어 있다. */
  failedApps: PreviewApp[];
}

function isPreviewState(value: unknown): value is PreviewState {
  return typeof value === 'string' && (STATES as readonly string[]).includes(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/** 상류 항목 하나를 우리 모양으로 바꾼다. 모양이 맞지 않거나 상태를 모르면(삭제된 배포 등) `null`. */
export function toPreviewDeployment(app: PreviewApp, raw: unknown): PreviewDeployment | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const id = asString(item.uid) ?? asString(item.id);
  const host = asString(item.url);
  const state = item.state ?? item.readyState;
  const created = typeof item.created === 'number' ? item.created : null;
  if (!id || !host || !isPreviewState(state) || created === null) {
    return null;
  }
  const meta =
    typeof item.meta === 'object' && item.meta !== null
      ? (item.meta as Record<string, unknown>)
      : {};
  const message = asString(meta.githubCommitMessage);
  return {
    app,
    id,
    url: host.startsWith('http') ? host : `https://${host}`,
    branchAliasUrl: null,
    branch: asString(meta.githubCommitRef),
    commitTitle: message ? (message.split('\n')[0]?.trim() ?? null) : null,
    state,
    createdAt: new Date(created).toISOString(),
  };
}

interface ProjectPage {
  deployments: PreviewDeployment[];
  /** 상류가 한 페이지를 가득 채워 줬는지. 그렇다면 더 있을 수 있다. 모르는 상태로 버린 항목도 센다. */
  full: boolean;
}

/** 앱 하나의 배포 한 페이지를 가져온다. 실패하면 던진다. 토큰은 메시지에 싣지 않는다. */
async function fetchProject(
  app: PreviewApp,
  projectId: string,
  query: PreviewDeploymentsQuery,
  token: string,
): Promise<ProjectPage> {
  const params = new URLSearchParams({
    projectId,
    teamId: TEAM_ID,
    target: query.target,
    limit: String(PAGE_SIZE),
    state: UPSTREAM_STATES,
  });
  if (query.cursor !== null) {
    params.set('until', String(query.cursor));
  }
  const response = await fetch(`${VERCEL_API_ORIGIN}/v6/deployments?${params}`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Vercel ${app} 배포 목록 응답 ${response.status}`);
  }
  const body = (await response.json()) as { deployments?: unknown };
  if (!Array.isArray(body.deployments)) {
    throw new Error(`Vercel ${app} 배포 목록 모양이 다릅니다.`);
  }
  return {
    deployments: body.deployments.flatMap((raw) => {
      const deployment = toPreviewDeployment(app, raw);
      return deployment ? [deployment] : [];
    }),
    full: body.deployments.length >= PAGE_SIZE,
  };
}

export async function listPreviewDeployments(
  token: string,
  query: PreviewDeploymentsQuery,
): Promise<PreviewDeploymentsResult> {
  const projects = PROJECTS.filter(({ app }) => query.app === 'all' || query.app === app);
  const settled = await Promise.allSettled(
    projects.map(({ app, projectId }) => fetchProject(app, projectId, query, token)),
  );
  const merged: PreviewDeployment[] = [];
  const failedApps: PreviewApp[] = [];
  let anyFull = false;
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      merged.push(...result.value.deployments);
      anyFull ||= result.value.full;
    } else {
      failedApps.push(projects[index]!.app);
    }
  });
  merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const deployments = merged.slice(0, PAGE_SIZE);
  // `until` 은 그 시각 이전만 주므로 커서는 마지막 항목의 시각이다. 프로젝트 하나가 한 페이지를 가득 채워 왔으면
  // 합친 건수가 10 이하여도 그 프로젝트에 더 있을 수 있다.
  const hasMore = merged.length > PAGE_SIZE || anyFull;
  const last = deployments[deployments.length - 1];
  const nextCursor = hasMore && last ? Date.parse(last.createdAt) : null;
  return { deployments, nextCursor, failedApps };
}

const TARGETS: readonly PreviewTarget[] = ['preview', 'production'];
const APP_FILTERS: readonly PreviewAppFilter[] = ['all', 'web', 'admin', 'business'];

/** 쿼리 문자열을 읽는다. 값이 없으면 기본값, 있는데 틀리면 `null`. */
export function parsePreviewDeploymentsQuery(
  params: URLSearchParams,
): PreviewDeploymentsQuery | null {
  const target = params.get('target') ?? 'preview';
  const app = params.get('app') ?? 'all';
  const rawCursor = params.get('cursor');
  if (!(TARGETS as readonly string[]).includes(target)) {
    return null;
  }
  if (!(APP_FILTERS as readonly string[]).includes(app)) {
    return null;
  }
  let cursor: number | null = null;
  if (rawCursor !== null) {
    cursor = /^[1-9]\d*$/.test(rawCursor) ? Number(rawCursor) : null;
    if (cursor === null || !Number.isSafeInteger(cursor)) {
      return null;
    }
  }
  return { target: target as PreviewTarget, app: app as PreviewAppFilter, cursor };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** 다른 함수들과 같은 봉투(`status`·`code`·`message`)로 답한다. 화면이 `message` 를 그대로 보인다. */
function failure(status: number, code: string, message: string): Response {
  return json(status, { status, code, message });
}

export async function GET(request: Request): Promise<Response> {
  if (!(await isAdmin(request.headers.get('authorization')))) {
    return failure(401, 'UNAUTHORIZED', '어드민 로그인이 필요합니다.');
  }

  // 401 로 두면 화면이 어드민 로그인 문제로 오해해서 503 으로 구분한다.
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    return failure(
      503,
      'VERCEL_TOKEN_MISSING',
      'VERCEL_API_TOKEN 환경변수가 없습니다. ogonggo-fe-admin 프로젝트의 production 환경변수에 넣어 주세요.',
    );
  }

  const query = parsePreviewDeploymentsQuery(new URL(request.url).searchParams);
  if (!query) {
    return failure(
      400,
      'INVALID_QUERY',
      'target 은 preview 나 production, app 은 all·web·admin·business, cursor 는 양의 정수여야 합니다.',
    );
  }

  return json(200, await listPreviewDeployments(token, query));
}
