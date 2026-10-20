import { getAccessToken } from './accessToken';

/**
 * Redash 저장 쿼리를 실행하는 작은 클라이언트. 통계 화면이 쓴다.
 *
 * `@ogonggo/api` 의 `httpClient` 를 쓰지 않는다. 그쪽은 401 을 받으면 어드민 로그인이 끝난 것으로 보고
 * 로그인 화면으로 돌려보내는데, 이 호출의 실패는 Redash 쪽 사정일 수 있다(`./shlink.ts` 와 같은 이유).
 *
 * `/redash-api/query` 는 dev 에서 `vite.config.ts` 의 미들웨어가, 배포본에서 `vercel.json` 의 rewrite 가
 * 부르는 서버리스 함수(`api/redash-query.ts`) 가 받는다. Redash API 키는 그쪽만 갖는다.
 */

const QUERY_PATH = '/redash-api/query';

export type RedashParameterValue = string | { start: string; end: string };

export type RedashRow = Record<string, string | number | null>;

export interface RedashQueryResult {
  columns: { name: string; type: string | null }[];
  rows: RedashRow[];
  /** Redash 가 데이터 소스에서 결과를 받아온 시각(ISO). */
  retrievedAt: string;
}

export class RedashQueryError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'RedashQueryError';
    this.status = status;
    this.code = code;
  }
}

export async function runRedashQuery(
  queryId: number,
  parameters: Record<string, RedashParameterValue>,
): Promise<RedashQueryResult> {
  const token = getAccessToken();
  const response = await fetch(QUERY_PATH, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ queryId, parameters }),
  });

  const text = await response.text().catch(() => '');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    // JSON 이 아닌 본문(게이트웨이 오류 등). 아래에서 상태 코드로 알린다.
  }

  if (!response.ok) {
    const error = body as { code?: string; message?: string } | undefined;
    throw new RedashQueryError(
      response.status,
      error?.code ?? '',
      error?.message ?? `쿼리 ${queryId} 를 불러오지 못했습니다(${response.status}).`,
    );
  }
  return body as RedashQueryResult;
}
