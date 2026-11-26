/**
 * 웹·어드민·비즈니스 세 앱의 프리뷰 배포를 합쳐 최신순으로 돌려주는 서버리스 함수. 어드민 배포본의
 * `GET /preview-api/deployments` 가 `vercel.json` 의 rewrite 로 여기에 들어온다. `프리뷰 배포` 화면이 쓴다.
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

/** 프로젝트마다 가져오는 건수. 같은 브랜치에 푸시가 이어지면 취소된 건이 쌓여 넉넉히 받는다. */
const PER_PROJECT_LIMIT = 40;
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

export interface PreviewDeploymentsResult {
  deployments: PreviewDeployment[];
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

/** 앱 하나의 프리뷰 배포를 가져온다. 실패하면 던진다. 토큰은 메시지에 싣지 않는다. */
async function fetchProject(
  app: PreviewApp,
  projectId: string,
  token: string,
): Promise<PreviewDeployment[]> {
  const query = new URLSearchParams({
    projectId,
    teamId: TEAM_ID,
    target: 'preview',
    limit: String(PER_PROJECT_LIMIT),
  });
  const response = await fetch(`${VERCEL_API_ORIGIN}/v6/deployments?${query}`, {
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
  return body.deployments.flatMap((raw) => {
    const deployment = toPreviewDeployment(app, raw);
    return deployment ? [deployment] : [];
  });
}

export async function listPreviewDeployments(token: string): Promise<PreviewDeploymentsResult> {
  const settled = await Promise.allSettled(
    PROJECTS.map(({ app, projectId }) => fetchProject(app, projectId, token)),
  );
  const deployments: PreviewDeployment[] = [];
  const failedApps: PreviewApp[] = [];
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      deployments.push(...result.value);
    } else {
      failedApps.push(PROJECTS[index]!.app);
    }
  });
  deployments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { deployments, failedApps };
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

  return json(200, await listPreviewDeployments(token));
}
