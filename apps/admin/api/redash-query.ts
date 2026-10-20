/**
 * Redash(`redash.lets-career.com`) 저장 쿼리를 실행해 결과를 돌려주는 서버리스 함수. 어드민 배포본의
 * `POST /redash-api/query` 가 `vercel.json` 의 rewrite 로 여기에 들어온다. 통계 화면이 쓴다.
 *
 * 브라우저가 Redash 를 직접 부르지 못하는 이유는 둘이다. Redash 가 CORS 를 열지 않아 사전 요청(OPTIONS)
 * 부터 403 이고(2026-10-20 확인), Redash API 키는 그 계정이 볼 수 있는 쿼리를 모두 실행하게 해 주므로
 * `VITE_` 변수로 번들에 박을 수 없다. 키는 이 함수의 서버 환경변수(`REDASH_API_KEY`)에만 둔다.
 * 로컬 어드민은 `vite.config.ts` 의 미들웨어가 이 파일의 `runRedashQuery` 를 그대로 부른다.
 *
 * 이 함수는 키를 가진 열린 프록시가 되면 안 되어서 셋을 막는다.
 * - 호출자: 어드민 API 에 호출자의 토큰을 보내 보고 200 이 아니면 돌려보낸다(`shlink-short-url.ts` 와 같다).
 * - 쿼리: 통계 화면이 쓰는 KPI 대시보드 v2(46번)의 쿼리만 실행한다(`ALLOWED_QUERY_IDS`).
 * - 파라미터: 문자열이나 `{ start, end }` 날짜 범위만 넘긴다. 값이 맞는지는 Redash 가 다시 본다 —
 *   이 쿼리들은 enum·날짜 범위만 받는 안전한 쿼리(`is_safe`)라 정해진 값 밖은 Redash 가 거절한다.
 */

/** Redash 주소. 버셀 rewrite 가 환경변수를 읽지 못해 `vercel.json` 처럼 주소를 파일에 적는다. */
const REDASH_ORIGIN = 'https://redash.lets-career.com';

/** 어드민 API 오리진. `shlink-short-url.ts` 와 같은 값이다. */
const ADMIN_API_ORIGIN = 'https://p5itn5nbm4.execute-api.ap-northeast-2.amazonaws.com';

/** 호출자가 어드민 토큰을 가졌는지만 본다. 인자 없는 가벼운 어드민 전용 조회다. */
const ADMIN_PROBE_URL = `${ADMIN_API_ORIGIN}/api/v1/admin/jobs/today`;

/**
 * 실행을 허용하는 쿼리. Redash 대시보드 `[오늘의공고] KPI 대시보드 v2` 의 위젯이 쓰는 여덟 개다.
 * 화면에 쿼리를 더하면 여기에도 더한다 — 더하지 않은 쿼리는 이 함수로 실행할 수 없다.
 */
const ALLOWED_QUERY_IDS = new Set([365, 366, 367, 368, 369, 370, 371, 372]);

/**
 * 이 시간 안에 같은 파라미터로 실행한 결과가 Redash 에 있으면 다시 실행하지 않는다. GA4 쿼리는 BigQuery
 * 를 돌아 비용이 들고, 운영 지표가 30분 사이에 판단을 바꿀 만큼 움직이지 않는다.
 */
const MAX_AGE_SECONDS = 1800;

const MAX_PARAMETERS = 10;
const UPSTREAM_TIMEOUT_MS = 15_000;
/** 실행을 기다리는 최대 시간. GA4 쿼리는 2~3초 걸린다(2026-10-20 실측). */
const JOB_WAIT_MS = 45_000;
const JOB_POLL_MS = 1_000;

/** Redash 작업 상태. 1 대기, 2 실행 중, 3 완료, 4 실패, 5 취소. */
const JOB_SUCCESS = 3;

export type RedashParameterValue = string | { start: string; end: string };

export interface RedashQueryInput {
  queryId: number;
  parameters: Record<string, RedashParameterValue>;
}

export interface RedashQueryResult {
  columns: { name: string; type: string | null }[];
  rows: Record<string, string | number | null>[];
  /** Redash 가 데이터 소스에서 결과를 받아온 시각(ISO). 캐시된 결과면 그만큼 지난 시각이다. */
  retrievedAt: string;
}

export class RedashFailure extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'RedashFailure';
    this.status = status;
    this.code = code;
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** 렛츠커리어 SSO 함수와 같은 봉투(`status`·`code`·`message`)로 답한다. */
function failure(status: number, code: string, message: string): Response {
  return json(status, { status, code, message });
}

export async function isAdmin(authorization: string | null): Promise<boolean> {
  if (!authorization?.startsWith('Bearer ')) {
    return false;
  }
  try {
    const response = await fetch(ADMIN_PROBE_URL, {
      headers: { authorization },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function isParameterValue(value: unknown): value is RedashParameterValue {
  if (typeof value === 'string') {
    return true;
  }
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { start, end } = value as Record<string, unknown>;
  return typeof start === 'string' && typeof end === 'string';
}

/** 허용한 모양만 꺼낸다. 맞지 않으면 `null`. */
export function parseRedashQueryInput(raw: unknown): RedashQueryInput | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const { queryId, parameters } = raw as Record<string, unknown>;
  if (typeof queryId !== 'number' || !ALLOWED_QUERY_IDS.has(queryId)) {
    return null;
  }
  const entries = Object.entries(parameters ?? {});
  if (
    typeof parameters !== 'object' ||
    entries.length > MAX_PARAMETERS ||
    !entries.every(([, value]) => isParameterValue(value))
  ) {
    return null;
  }
  return { queryId, parameters: Object.fromEntries(entries) as RedashQueryInput['parameters'] };
}

async function redashFetch(apiKey: string, path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${REDASH_ORIGIN}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', authorization: `Key ${apiKey}` },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    throw new RedashFailure(502, 'REDASH_UNREACHABLE', 'Redash 서버에 연결하지 못했습니다.');
  }
  // 키가 틀리면 Redash 가 로그인 화면으로 보내거나 403 을 준다. 그대로 넘기면 화면이 어드민 로그인
  // 만료로 읽으므로 502 로 바꿔 설정 문제임을 드러낸다.
  if (response.status === 401 || response.status === 403 || response.redirected) {
    throw new RedashFailure(502, 'REDASH_KEY_REJECTED', 'Redash 가 API 키를 거부했습니다.');
  }
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  if (!response.ok) {
    throw new RedashFailure(
      502,
      'REDASH_ERROR',
      body?.message ?? `Redash 가 ${response.status} 로 답했습니다.`,
    );
  }
  return body;
}

interface RedashQueryResultBody {
  query_result: {
    retrieved_at: string;
    data: Pick<RedashQueryResult, 'columns' | 'rows'>;
  };
}

interface RedashJobBody {
  job: { id: string; status: number; error?: string; query_result_id?: number | null };
}

function toResult(body: RedashQueryResultBody): RedashQueryResult {
  const { data, retrieved_at } = body.query_result;
  return {
    columns: data.columns.map(({ name, type }) => ({ name, type })),
    rows: data.rows,
    retrievedAt: retrieved_at,
  };
}

/**
 * 쿼리를 실행하고 결과가 나올 때까지 기다린다. 캐시가 있으면 Redash 가 곧장 결과를 주고, 없으면 작업을
 * 만들어 주므로 끝날 때까지 상태를 묻는다. 호출자 검증은 하지 않는다 — 그것은 `POST` 의 일이다.
 */
export async function runRedashQuery(
  apiKey: string,
  { queryId, parameters }: RedashQueryInput,
): Promise<RedashQueryResult> {
  const started = await redashFetch(apiKey, `/api/queries/${queryId}/results`, {
    method: 'POST',
    body: JSON.stringify({ parameters, max_age: MAX_AGE_SECONDS }),
  });
  if ((started as Partial<RedashQueryResultBody>).query_result) {
    return toResult(started as RedashQueryResultBody);
  }

  let { job } = started as RedashJobBody;
  const deadline = Date.now() + JOB_WAIT_MS;
  while (job.status !== JOB_SUCCESS) {
    if (job.status > JOB_SUCCESS) {
      throw new RedashFailure(502, 'REDASH_QUERY_FAILED', job.error || '쿼리 실행에 실패했습니다.');
    }
    if (Date.now() > deadline) {
      throw new RedashFailure(504, 'REDASH_TIMEOUT', '쿼리 실행이 너무 오래 걸립니다.');
    }
    await new Promise((resolve) => setTimeout(resolve, JOB_POLL_MS));
    ({ job } = (await redashFetch(apiKey, `/api/jobs/${job.id}`)) as RedashJobBody);
  }

  const result = await redashFetch(apiKey, `/api/query_results/${job.query_result_id}`);
  return toResult(result as RedashQueryResultBody);
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.REDASH_API_KEY;
  if (!apiKey) {
    return failure(503, 'REDASH_NOT_CONFIGURED', 'Redash API 키 설정이 없습니다.');
  }

  if (!(await isAdmin(request.headers.get('authorization')))) {
    return failure(401, 'UNAUTHORIZED', '어드민 로그인이 필요합니다.');
  }

  let input: RedashQueryInput | null;
  try {
    input = parseRedashQueryInput(await request.json());
  } catch {
    input = null;
  }
  if (!input) {
    return failure(400, 'INVALID_REQUEST', '실행할 수 없는 쿼리 요청입니다.');
  }

  try {
    return json(200, await runRedashQuery(apiKey, input));
  } catch (error) {
    if (error instanceof RedashFailure) {
      return failure(error.status, error.code, error.message);
    }
    throw error;
  }
}
