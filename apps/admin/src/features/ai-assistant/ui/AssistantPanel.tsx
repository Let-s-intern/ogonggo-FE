import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button, Callout, Textarea, cn } from '@ogonggo/ui';
import { useAssistantChat } from '../model/useAssistantChat';

const SUGGESTIONS = [
  '모집 중인 마케팅 공고 찾아줘',
  '지난 7일 통계 핵심만 요약해줘',
  '이 공고 담당 업무 문장 다듬어서 넣어줘',
  '검수 대기 화면 열어줘',
];

const OPEN_STORAGE_KEY = 'ogonggo.admin.assistantOpen';

/** 패널 폭. 레이아웃이 `--assistant-width` 로 내려 오른쪽에 붙는 플로팅 요소가 패널을 피하게 한다. */
export const ASSISTANT_OPEN_WIDTH = '400px';
export const ASSISTANT_CLOSED_WIDTH = '48px';

/**
 * 패널을 열어 둘지. 운영자마다 화면을 쓰는 방식이 달라 마지막 상태를 이 브라우저에 기억한다. 저장소를
 * 못 쓰는 환경(사생활 보호 창 등)에서는 기억하지 않을 뿐 패널은 그대로 쓴다.
 */
export function useAssistantPanelOpen(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(OPEN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const update = (next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(OPEN_STORAGE_KEY, String(next));
    } catch {
      // 기억하지 못해도 이번 화면에서는 열리고 닫힌다.
    }
  };
  return [open, update];
}

interface AssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 어드민 오른쪽에 붙는 AI 비서 패널. 레이아웃(`widgets/admin-layout`)이 본문 오른쪽에 그린다.
 *
 * 본문을 덮지 않고 옆에 붙는다 — 공고 목록이나 수정 창을 보면서 묻는 일이 많아, 덮으면 보던 것을 가린다.
 * 닫으면 얇은 띠만 남아 다시 열 수 있다.
 *
 * 비서는 공고를 찾고, 공고·통계를 요약하고, 화면을 옮기고, 공고 수정 창의 텍스트 칸을 채운다. 저장은 하지
 * 않는다 — 채운 칸은 사람이 확인하고 수정 창의 저장 버튼을 눌러야 반영된다.
 *
 * 닫아도 대화는 남는다. 화면을 옮기며 이어 물을 수 있게 레이아웃이 살아 있는 동안 둔다.
 */
export function AssistantPanel({ open, onOpenChange }: AssistantPanelProps) {
  const [draft, setDraft] = useState('');
  const { lines, error, isBusy, send, stop, reset } = useAssistantChat();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lines, isBusy, open]);

  const submit = (text: string) => {
    if (!text.trim() || isBusy) {
      return;
    }
    setDraft('');
    void send(text);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 조합 중의 Enter 는 글자를 확정하는 키다. 그때 보내면 마지막 글자가 두 번 들어간다.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit(draft);
    }
  };

  if (!open) {
    return (
      <aside
        data-pdf-hide
        style={{ width: ASSISTANT_CLOSED_WIDTH }}
        className="sticky top-0 h-screen shrink-0 border-l border-gray-200 bg-white"
      >
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-label="AI 비서 열기"
          aria-expanded={false}
          className="flex h-full w-full flex-col items-center gap-3 pt-6 text-gray-500 transition-colors hover:bg-gray-50 hover:text-blue-600"
        >
          <span aria-hidden="true" className="icon-[lucide--sparkles] block h-5 w-5" />
          <span className="text-sm font-medium [text-orientation:upright] [writing-mode:vertical-rl]">
            AI 비서
          </span>
          {isBusy ? (
            <span className="h-2 w-2 rounded-full bg-blue-500" title="답을 만드는 중" />
          ) : null}
        </button>
      </aside>
    );
  }

  return (
    <aside
      data-pdf-hide
      aria-label="AI 비서"
      style={{ width: ASSISTANT_OPEN_WIDTH }}
      className="sticky top-0 flex h-screen shrink-0 flex-col border-l border-gray-200 bg-white"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900">AI 비서</h2>
          <p className="pt-0.5 text-xs text-gray-500">
            찾기, 요약, 화면 이동, 공고 문장 다듬기를 합니다. 저장은 직접 눌러야 반영됩니다.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
          {lines.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={reset}>
              새 대화
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            aria-label="AI 비서 닫기"
            aria-expanded
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {lines.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">이렇게 물어볼 수 있습니다.</p>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => submit(suggestion)}
                className="block w-full rounded-md border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-00"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {lines.map((line, index) => (
          <p
            key={index}
            className={cn(
              'whitespace-pre-wrap',
              line.kind === 'user' &&
                'ml-10 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900',
              line.kind === 'activity' && 'text-xs text-gray-400',
              line.kind === 'assistant' && 'text-sm leading-relaxed text-gray-900',
            )}
          >
            {line.text}
          </p>
        ))}

        {isBusy ? <p className="text-sm text-gray-400">생각하는 중입니다.</p> : null}
        {error ? <Callout tone="error">{error}</Callout> : null}
      </div>

      <form onSubmit={onSubmit} className="border-t border-gray-200 p-4">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="무엇을 도와드릴까요? Shift+Enter 로 줄을 바꿉니다."
          rows={2}
          maxLength={1000}
        />
        <div className="flex justify-end gap-2 pt-2">
          {isBusy ? (
            <Button type="button" variant="secondary" size="sm" onClick={stop}>
              멈추기
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={isBusy || !draft.trim()}>
            보내기
          </Button>
        </div>
      </form>
    </aside>
  );
}
