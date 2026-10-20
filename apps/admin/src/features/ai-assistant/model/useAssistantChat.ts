import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { type AssistantApiMessage, callAssistant } from '@/shared/api/assistant';
import { describeToolCall, runTool } from './tools';

/** 채팅 창에 그리는 줄. 모델과 주고받는 메시지와 따로 둔다 — 도구 결과는 사람에게 보일 글이 아니다. */
export type ChatLine =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  /** 도구를 부른 사실. "공고 검색: 마케팅" 같은 한 줄이다. */
  | { kind: 'activity'; text: string };

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

/**
 * 비서와의 대화. 질문을 보내고, 모델이 도구를 부르면 실행해 결과를 붙여 다시 묻기를 답이 나올 때까지
 * 되풀이한다. 대화는 레이아웃이 살아 있는 동안(화면을 옮겨도) 남고, 새로고침하면 사라진다.
 */
export function useAssistantChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const messagesRef = useRef<AssistantApiMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  // 도구가 화면을 옮기면 그 뒤 호출의 "현재 화면" 도 바뀌어야 한다. 렌더를 기다리지 않고 바로 고친다.
  const pathRef = useRef(location.pathname + location.search);

  useEffect(() => {
    pathRef.current = location.pathname + location.search;
  }, [location]);

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

      const messages: AssistantApiMessage[] = [
        ...messagesRef.current,
        { role: 'user', content: trimmed },
      ];
      const context = {
        navigate: (path: string) => {
          pathRef.current = path;
          navigate(path);
        },
      };

      try {
        for (let round = 0; ; round += 1) {
          const reply = await callAssistant(messages, pathRef.current, controller.signal);
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
                text: '요청을 처리하는 단계가 너무 많아 멈췄습니다. 더 좁혀서 물어봐 주세요.',
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
            const result = await runTool(call.function.name, args, context);
            messages.push({ role: 'tool', tool_call_id: call.id, content: result });
          }
        }
        messagesRef.current = messages;
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : 'AI 비서가 답하지 못했습니다.');
        }
        // 끊긴 왕복은 대화에 남기지 않는다. 도구 호출에 짝이 되는 결과가 빠지면 다음 호출이 거절된다.
      } finally {
        setIsBusy(false);
        abortRef.current = null;
      }
    },
    [isBusy, navigate],
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
