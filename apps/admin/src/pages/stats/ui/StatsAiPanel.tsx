import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button, Callout, Textarea } from '@ogonggo/ui';
import { KPI_QUERY, type KpiFilters, toRedashParameters } from '@/entities/kpi';
import { type StatsAiMessage, askStatsAi } from '@/shared/api/statsAi';

interface StatsAiPanelProps {
  filters: KpiFilters;
  onClose: () => void;
}

const SUGGESTIONS = [
  '이번 기간의 핵심 변화 세 가지만 알려줘',
  '지원 클릭률이 가장 좋은 채널과 이유는?',
  '성과가 좋은 공고들의 공통점은?',
];

/**
 * 통계 화면 오른쪽에 여는 AI 질문 창. 지금 필터 기준의 Redash 결과를 근거로 답한다(`api/stats-ask.ts`).
 *
 * 대화는 이 창을 연 동안만 남는다. 필터를 바꾸면 근거 데이터가 달라져 앞선 답과 어긋날 수 있어,
 * 그 사실을 창 위에 적어 둔다.
 */
export function StatsAiPanel({ filters, onClose }: StatsAiPanelProps) {
  const [messages, setMessages] = useState<StatsAiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 답이 늘어나는 동안 맨 아래를 따라간다.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  // 창을 닫으면 받던 답을 끊는다.
  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isAnswering) {
      return;
    }
    const history = messages;
    setMessages([
      ...history,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: '' },
    ]);
    setDraft('');
    setError('');
    setIsAnswering(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await askStatsAi(
        {
          question: trimmed,
          history,
          queries: Object.values(KPI_QUERY).map((queryId) => ({
            queryId,
            parameters: toRedashParameters(queryId, filters),
          })),
        },
        (delta) =>
          setMessages((current) => {
            const last = current.at(-1);
            return last
              ? [...current.slice(0, -1), { ...last, content: last.content + delta }]
              : current;
          }),
        controller.signal,
      );
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(caught instanceof Error ? caught.message : 'AI 답을 받지 못했습니다.');
        // 빈 답 말풍선은 지운다. 남겨 두면 다음 질문의 앞선 대화로 빈 답이 넘어간다.
        setMessages((current) => (current.at(-1)?.content ? current : current.slice(0, -1)));
      }
    } finally {
      setIsAnswering(false);
      abortRef.current = null;
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void ask(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 조합 중의 Enter 는 글자를 확정하는 키다. 그때 보내면 마지막 글자가 두 번 들어간다.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask(draft);
    }
  };

  return (
    <aside
      data-pdf-hide
      className="fixed inset-y-0 right-0 z-40 flex w-[420px] flex-col border-l border-gray-200 bg-white shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">AI 에게 묻기</h2>
          <p className="pt-0.5 text-xs text-gray-500">
            지금 필터 기준의 통계로 답합니다. 숫자는 표에서 한 번 더 확인하세요.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
          {messages.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isAnswering}
              onClick={() => {
                setMessages([]);
                setError('');
              }}
            >
              새 대화
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">이런 것을 물어볼 수 있습니다.</p>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void ask(suggestion)}
                className="block w-full rounded-md border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-00"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((message, index) =>
          message.role === 'user' ? (
            <p
              key={index}
              className="ml-8 whitespace-pre-wrap rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900"
            >
              {message.content}
            </p>
          ) : (
            <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
              {message.content || (isAnswering ? '데이터를 읽고 있습니다.' : '')}
            </p>
          ),
        )}

        {error ? <Callout tone="error">{error}</Callout> : null}
      </div>

      <form onSubmit={onSubmit} className="border-t border-gray-200 p-4">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="질문을 입력하세요. Shift+Enter 로 줄을 바꿉니다."
          rows={3}
          maxLength={1000}
        />
        <div className="flex justify-end gap-2 pt-2">
          {isAnswering ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => abortRef.current?.abort()}
            >
              멈추기
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={isAnswering || !draft.trim()}>
            보내기
          </Button>
        </div>
      </form>
    </aside>
  );
}
