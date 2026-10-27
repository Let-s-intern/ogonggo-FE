'use client';

import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button, Callout, Textarea, cn } from '@ogonggo/ui';
import type { ToolContext } from '@/lib/ai/tools';
import { useAssistantChat } from '@/lib/client/useAssistantChat';

/** 자주 쓰는 요청. 누르면 바로 보낸다. */
const FAVORITES = [
  { label: '제목 크게', prompt: '큰 제목 글자를 지금보다 크게 해 줘' },
  { label: '로고 오른쪽 아래', prompt: '회사 로고를 오른쪽 아래로 옮겨 줘' },
  { label: '목록 가운데 정렬', prompt: '목록 흰 판을 가로 가운데로 정렬해 줘' },
  { label: '렛츠커리어 로고로', prompt: '브랜드 로고를 렛츠커리어 로고로 바꿔 줘' },
];

/**
 * 오른쪽 AI 탭. 말로 요청하면 비서가 도구로 문구·템플릿·설정·요소 배치를 직접 바꾼다. 받기는 하지 않는다
 * — 사람이 하단 바에서 받는다.
 *
 * 탭을 옮겨도 대화가 남도록 속성 패널이 숨겨 둔 채로 계속 그린다.
 */
export function AssistantPanel({ context }: { context: ToolContext }) {
  const [draft, setDraft] = useState('');
  const { lines, error, isBusy, send, stop, reset } = useAssistantChat(context);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lines, isBusy]);

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

  // 화면 높이에서 머리글·탭과 하단 받기 바를 뺀 만큼. 넘으면 입력 칸이 하단 바에 가린다.
  return (
    <div className="flex h-[calc(100vh-18rem)] min-h-[420px] flex-col">
      <div className="flex items-start justify-between gap-2 pb-3">
        <p className="text-xs text-gray-500">
          문구, 템플릿, 색과 로고, 글자 크기, 요소 자리를 바꿉니다. 바꾼 것은 캔버스를 누른 뒤
          Ctrl+Z 로 한 번에 되돌립니다.
        </p>
        {lines.length > 0 ? (
          <Button variant="ghost" size="sm" className="shrink-0" onClick={reset}>
            새 대화
          </Button>
        ) : null}
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto border-t border-gray-100 py-3">
        {lines.length === 0 ? (
          <p className="text-sm text-gray-500">
            예: 제목을 더 크게, 회사 로고를 오른쪽 아래로, 템플릿을 브랜드색 물결로.
          </p>
        ) : null}
        {lines.map((line, index) => (
          <p
            key={index}
            className={cn(
              'whitespace-pre-wrap',
              line.kind === 'user' && 'ml-8 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900',
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

      <form onSubmit={onSubmit} className="border-t border-gray-100 pt-3">
        <div className="flex flex-wrap gap-1.5 pb-2">
          {FAVORITES.map((favorite) => (
            <button
              key={favorite.label}
              type="button"
              title={favorite.prompt}
              disabled={isBusy}
              onClick={() => submit(favorite.prompt)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {favorite.label}
            </button>
          ))}
        </div>
        <Textarea
          aria-label="AI 비서에게 요청"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="무엇을 바꿀까요? Shift+Enter 로 줄을 바꿉니다."
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
    </div>
  );
}
