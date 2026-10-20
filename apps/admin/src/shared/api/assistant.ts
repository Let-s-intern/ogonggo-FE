import { getAccessToken } from './accessToken';

/**
 * AI 비서의 모델 호출 클라이언트. 한 번 부르면 모델의 답 하나(글이나 도구 호출)가 온다.
 *
 * `/assistant-api/chat` 은 dev 에서 `vite.config.ts` 의 미들웨어가, 배포본에서 `vercel.json` 의 rewrite 가
 * 부르는 서버리스 함수(`api/assistant.ts`) 가 받는다. 모델 키는 그쪽만 갖는다.
 */

const CHAT_PATH = '/assistant-api/chat';

export interface AssistantToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type AssistantApiMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: AssistantToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

export interface AssistantReply {
  content: string | null;
  tool_calls?: AssistantToolCall[];
}

export class AssistantError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AssistantError';
    this.status = status;
  }
}

export async function callAssistant(
  messages: AssistantApiMessage[],
  path: string,
  signal?: AbortSignal,
): Promise<AssistantReply> {
  const token = getAccessToken();
  const response = await fetch(CHAT_PATH, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, path }),
    signal,
  });

  const text = await response.text().catch(() => '');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    // JSON 이 아닌 본문(게이트웨이 오류 등). 아래에서 상태 코드로 알린다.
  }
  if (!response.ok) {
    throw new AssistantError(
      response.status,
      (body as { message?: string } | undefined)?.message ??
        `AI 비서가 답하지 못했습니다(${response.status}).`,
    );
  }
  return body as AssistantReply;
}
