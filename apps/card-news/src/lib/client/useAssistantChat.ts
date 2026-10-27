'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  describeScreen,
  describeToolCall,
  runTool,
  type ToolContext,
  type ToolSession,
} from '../ai/tools';

/** 채팅 창에 그리는 줄. 모델과 주고받는 메시지와 따로 둔다 — 도구 결과는 사람에게 보일 글이 아니다. */
export type ChatLine =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  /** 도구를 부른 사실. "설정 바꾸기: brandMark" 같은 한 줄이다. */
  | { kind: 'activity'; text: string };

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

type ApiMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

/** 한 질문에 도구를 부르고 다시 묻는 왕복의 최대 횟수. 모델이 같은 도구를 되풀이할 때 끊는다. */
const MAX_TOOL_ROUNDS = 6;

function parseArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function callAssistant(
  messages: ApiMessage[],
  screen: string,
  signal: AbortSignal,
): Promise<{ content: string | null; tool_calls?: ToolCall[] }> {
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, screen }),
    signal,
  });
  const body = (await response.json().catch(() => ({}))) as {
    content?: string | null;
    tool_calls?: ToolCall[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.message ?? 'AI 비서가 답하지 못했습니다.');
  }
  return { content: body.content ?? null, tool_calls: body.tool_calls };
}

/**
 * 편집 비서와의 대화. 질문을 보내고, 모델이 도구를 부르면 편집 상태에 실행해 결과를 붙여 다시 묻기를
 * 답이 나올 때까지 되풀이한다. 한 질문에서 바꾼 것은 실행 취소 한 단계다(`../ai/tools.ts`).
 * 대화는 편집 화면이 열려 있는 동안 남고, 새로고침하면 사라진다.
 */
export function useAssistantChat(context: ToolContext) {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const messagesRef = useRef<ApiMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isBusy) {
        return;
      }
      setLines((current) => [...current, { kind: 'user', text: trimmed }]);
      setError('');
      setIsBusy(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const messages: ApiMessage[] = [...messagesRef.current, { role: 'user', content: trimmed }];
      const session: ToolSession = { remembered: false };

      try {
        for (let round = 0; ; round += 1) {
          const reply = await callAssistant(messages, describeScreen(context), controller.signal);
          messages.push({
            role: 'assistant',
            content: reply.content,
            tool_calls: reply.tool_calls,
          });

          if (!reply.tool_calls?.length) {
            setLines((current) => [...current, { kind: 'assistant', text: reply.content ?? '' }]);
            break;
          }
          if (round >= MAX_TOOL_ROUNDS) {
            setLines((current) => [
              ...current,
              {
                kind: 'assistant',
                text: '요청을 처리하는 단계가 너무 많아 멈췄습니다. 더 좁혀서 말해 주세요.',
              },
            ]);
            break;
          }
          for (const call of reply.tool_calls) {
            const args = parseArguments(call.function.arguments);
            setLines((current) => [
              ...current,
              { kind: 'activity', text: describeToolCall(call.function.name, args) },
            ]);
            const result = await runTool(call.function.name, args, context, session);
            messages.push({ role: 'tool', tool_call_id: call.id, content: result });
          }
        }
        messagesRef.current = messages;
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : 'AI 비서가 답하지 못했습니다.');
        }
        // 끊긴 왕복은 대화에 남기지 않는다. 도구 호출에 짝이 되는 결과가 빠지면 다음 호출이 거절된다.
        // 이미 바꾼 카드는 그대로 두고, Ctrl+Z 한 번으로 질문 전으로 돌린다.
      } finally {
        setIsBusy(false);
        abortRef.current = null;
      }
    },
    [isBusy, context],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    messagesRef.current = [];
    setLines([]);
    setError('');
  }, []);

  return { lines, error, isBusy, send, stop, reset };
}
