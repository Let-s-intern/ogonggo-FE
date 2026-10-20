import { getAccessToken } from './accessToken';
import type { RedashParameterValue } from './redash';

/**
 * 통계 AI 질문 창의 클라이언트. 답을 조각으로 받아 `onDelta` 로 넘긴다.
 *
 * `/stats-ai/ask` 는 dev 에서 `vite.config.ts` 의 미들웨어가, 배포본에서 `vercel.json` 의 rewrite 가 부르는
 * 서버리스 함수(`api/stats-ask.ts`) 가 받는다. 모델 키와 Redash 키는 그쪽만 갖는다.
 */

const ASK_PATH = '/stats-ai/ask';

export interface StatsAiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StatsAiRequest {
  question: string;
  /** 앞선 대화. 이번 질문은 넣지 않는다. */
  history: StatsAiMessage[];
  /** 화면이 보고 있는 쿼리와 파라미터. 서버가 이것으로 Redash 결과를 다시 가져와 근거로 쓴다. */
  queries: { queryId: number; parameters: Record<string, RedashParameterValue> }[];
}

export class StatsAiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'StatsAiError';
    this.status = status;
  }
}

export async function askStatsAi(
  request: StatsAiRequest,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(ASK_PATH, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    let message = `AI 답을 받지 못했습니다(${response.status}).`;
    try {
      message = (JSON.parse(text) as { message?: string }).message ?? message;
    } catch {
      // JSON 이 아닌 본문(게이트웨이 오류 등). 상태 코드로 알린다.
    }
    throw new StatsAiError(response.status, message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    onDelta(decoder.decode(value, { stream: true }));
  }
}
