import {
  type RedashQueryInput,
  type RedashQueryResult,
  RedashFailure,
  isAdmin,
  parseRedashQueryInput,
  runRedashQuery,
} from './redash-query';

/**
 * 통계 화면의 AI 질문 창. 어드민 배포본의 `POST /stats-ai/ask` 가 `vercel.json` 의 rewrite 로 여기에
 * 들어온다. 로컬 어드민은 `vite.config.ts` 의 미들웨어가 이 파일의 `answerStatsQuestion` 을 부른다.
 *
 * 화면이 보고 있는 쿼리와 파라미터를 받아 이 함수가 Redash 에서 결과를 다시 가져오고(같은 파라미터라
 * Redash 캐시가 답한다), 그 표를 근거로 LLM 이 답한다. 화면이 데이터를 직접 보내지 않는 이유는, 그러면
 * 근거 데이터를 요청에서 고쳐 넣을 수 있기 때문이다 — 숫자는 늘 Redash 에서 온다.
 *
 * 모델은 OpenAI 호환 `chat/completions` 로 부른다. 카드뉴스(`apps/card-news/src/lib/ai/draft.ts`)와 같은
 * 방식이라 DeepSeek·Gemini 를 주소와 모델 이름만 바꿔 쓸 수 있다. 키는 서버 환경변수에만 둔다.
 *
 *   DeepSeek  STATS_LLM_BASE_URL=https://api.deepseek.com  STATS_LLM_MODEL=deepseek-chat
 */

/** 쿼리 번호의 이름. 모델이 답에서 어느 표를 근거로 했는지 말할 때 쓴다. */
const QUERY_TITLES: Record<number, string> = {
  365: 'KPI 기간별 (GA4)',
  366: '회원가입 기간별 (DB)',
  367: '재방문율·신규 활성화율 주간 (GA4)',
  368: '공고 수 (DB)',
  369: '공고별 성과 (GA4)',
  370: '채널별 KPI (GA4)',
  371: '채널별 방문자 추이 (GA4)',
  372: '검색 유입 랜딩 페이지 (GA4)',
};

/** 표 하나에서 모델에 넘길 최대 행 수. 공고별 성과(300행)·랜딩 페이지(170여 행)는 위쪽만 간다. */
const MAX_ROWS_PER_TABLE = 60;
const MAX_QUESTION_LENGTH = 1000;
/** 앞선 대화 중 함께 보낼 최대 개수. 길어지면 오래된 것부터 버린다. */
const MAX_HISTORY = 8;
const LLM_TIMEOUT_MS = 120_000;

const SYSTEM_PROMPT = `너는 채용 공고 서비스 '오늘의 공고' 운영팀의 데이터 분석가다. 운영자가 어드민 통계 화면을 보며 묻는 질문에 답한다.

[근거]
- 아래 [데이터] 의 표만 근거로 쓴다. 표에 없는 숫자를 만들지 않는다.
- 숫자를 말할 때는 어느 표의 어느 행·컬럼 값인지 함께 적는다. 예: "KPI 기간별 표의 10/17 지원 클릭 사용자 54명".
- 증감을 계산했다면 계산식을 짧게 보인다. 예: "(54-40)/40 = +35%".
- 데이터로 알 수 없는 원인(광고 집행, 외부 이슈 등)은 단정하지 않는다. 추정이면 문장 앞에 "추정:" 을 붙이고 확인할 방법을 제안한다.
- 표가 잘려 있으면(위쪽 일부 행만 있음) 그 사실을 감안해 말한다.

[데이터 해석]
- 비율·전환율 컬럼(이름이 율·률·비중으로 끝남)은 이미 % 단위 숫자다. 4.6 은 4.6% 다.
- 방문·전환 지표는 GA4(10/13 런칭부터, 기기 기준 순 사용자), 가입·공고 수는 서비스 DB(KST) 기준이다.
- 직군·경력 필터는 이벤트가 일어난 공고의 속성이라 공고 이벤트에만 걸린다.
- GA4 일간 데이터는 하루 늦게 들어온다. 주간·월간의 마지막 기간은 집계 중일 수 있다.

[답 형식]
- 한국어로, 결론부터 2~3문장. 필요하면 "-" 목록으로 근거를 붙인다.
- 마크다운 표, 제목(#), 굵게(**), 이모지를 쓰지 않는다.
- 묻지 않은 지표를 길게 늘어놓지 않는다.`;

export interface StatsAskMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StatsAskInput {
  question: string;
  history: StatsAskMessage[];
  queries: RedashQueryInput[];
}

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function llmConfigFrom(env: Record<string, string | undefined>): LlmConfig | null {
  const apiKey = env.STATS_LLM_API_KEY?.trim();
  const baseUrl = env.STATS_LLM_BASE_URL?.trim().replace(/\/$/, '');
  const model = env.STATS_LLM_MODEL?.trim();
  return apiKey && baseUrl && model ? { apiKey, baseUrl, model } : null;
}

/** 허용한 모양만 꺼낸다. 맞지 않으면 `null`. */
export function parseStatsAskInput(raw: unknown): StatsAskInput | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const { question, history, queries } = raw as Record<string, unknown>;
  if (
    typeof question !== 'string' ||
    !question.trim() ||
    question.length > MAX_QUESTION_LENGTH ||
    !Array.isArray(queries) ||
    queries.length === 0 ||
    queries.length > Object.keys(QUERY_TITLES).length
  ) {
    return null;
  }
  const parsedQueries = queries.map(parseRedashQueryInput);
  if (parsedQueries.some((query) => query === null)) {
    return null;
  }
  const messages = (Array.isArray(history) ? history : [])
    .filter(
      (message): message is StatsAskMessage =>
        typeof message === 'object' &&
        message !== null &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string',
    )
    .slice(-MAX_HISTORY)
    .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));
  return {
    question: question.trim(),
    history: messages,
    queries: parsedQueries as RedashQueryInput[],
  };
}

/** 표를 탭으로 구분한 글로. CSV 보다 쉼표 섞인 공고명에 덜 헷갈리고 토큰도 적다. */
function tableText(query: RedashQueryInput, result: RedashQueryResult): string {
  const columns = result.columns.map(({ name }) => name);
  const rows = result.rows.slice(0, MAX_ROWS_PER_TABLE);
  const cut =
    result.rows.length > rows.length
      ? ` (전체 ${result.rows.length}행 중 위 ${rows.length}행)`
      : '';
  return [
    `### ${QUERY_TITLES[query.queryId]}${cut}`,
    `파라미터: ${JSON.stringify(query.parameters)}`,
    columns.join('\t'),
    ...rows.map((row) => columns.map((column) => row[column] ?? '').join('\t')),
  ].join('\n');
}

/**
 * 질문에 답하는 글자 흐름을 돌려준다. 모델이 쓰는 대로 조각이 흘러나온다. 호출자 검증은 하지 않는다 —
 * 그것은 `POST` 의 일이다.
 */
export async function answerStatsQuestion(
  config: LlmConfig,
  redashApiKey: string,
  input: StatsAskInput,
): Promise<ReadableStream<Uint8Array>> {
  const results = await Promise.all(
    input.queries.map((query) => runRedashQuery(redashApiKey, query)),
  );
  const data = input.queries.map((query, index) => tableText(query, results[index]!)).join('\n\n');

  let upstream: Response;
  try {
    upstream = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        stream: true,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\n[데이터]\n${data}` },
          ...input.history,
          { role: 'user', content: input.question },
        ],
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
  } catch {
    throw new RedashFailure(502, 'LLM_UNREACHABLE', 'AI 서버에 연결하지 못했습니다.');
  }
  if (!upstream.ok || !upstream.body) {
    const detail = (await upstream.text().catch(() => '')).slice(0, 200);
    throw new RedashFailure(
      502,
      'LLM_ERROR',
      `AI 서버가 ${upstream.status} 로 답했습니다. ${detail}`,
    );
  }

  // SSE(`data: {...}` 줄)에서 글자 조각만 꺼내 그대로 흘려보낸다.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  return upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const payload = line.replace(/^data:\s*/, '').trim();
          if (!line.startsWith('data:') || !payload || payload === '[DONE]') {
            continue;
          }
          try {
            const delta = (JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] })
              .choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          } catch {
            // 끊겨 들어온 줄은 버린다. 다음 줄은 온전하다.
          }
        }
      },
    }),
  );
}

function failure(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ status, code, message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function POST(request: Request): Promise<Response> {
  const redashApiKey = process.env.REDASH_API_KEY;
  const config = llmConfigFrom(process.env);
  if (!redashApiKey || !config) {
    return failure(503, 'STATS_AI_NOT_CONFIGURED', 'AI 질문에 필요한 서버 설정이 없습니다.');
  }

  if (!(await isAdmin(request.headers.get('authorization')))) {
    return failure(401, 'UNAUTHORIZED', '어드민 로그인이 필요합니다.');
  }

  let input: StatsAskInput | null;
  try {
    input = parseStatsAskInput(await request.json());
  } catch {
    input = null;
  }
  if (!input) {
    return failure(400, 'INVALID_REQUEST', '보낼 수 없는 질문입니다.');
  }

  try {
    return new Response(await answerStatsQuestion(config, redashApiKey, input), {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof RedashFailure) {
      return failure(error.status, error.code, error.message);
    }
    throw error;
  }
}
