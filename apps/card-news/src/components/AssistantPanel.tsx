'use client';

import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { Button, Callout, cn } from '@ogonggo/ui';
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
 * 캔버스 아래 떠 있는 `AI로 수정` 입력창. 말로 요청하면 비서가 도구로 문구·템플릿·설정·요소 배치를
 * 직접 바꾼다. 문구 다시 쓰기도 여기서 한다(`rewrite_copy`). 받기는 하지 않는다 — 사람이 위 막대의
 * `내보내기` 로 받는다.
 *
 * 대화 기록은 `기록` 을 누르거나 보내면 입력창 위로 펼쳐진다. 접어도 대화와 진행 중인 요청은 남는다.
 * `scope` 는 입력창 위에 그릴 범위 알약이다.
 */
export function AssistantPanel({ context, scope }: { context: ToolContext; scope?: ReactNode }) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const { lines, error, isBusy, send, stop, reset } = useAssistantChat(context);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lines, isBusy, open]);

  const submit = (text: string) => {
    if (!text.trim() || isBusy) {
      return;
    }
    setDraft('');
    setOpen(true);
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
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="AI로 수정"
      className="flex w-[min(620px,calc(100%-2rem))] flex-col gap-2 rounded-2xl border border-indigo-200 bg-white p-2.5 shadow-[0_6px_20px_rgba(55,48,163,0.12)]"
    >
      {open ? (
        <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              문구, 템플릿, 색과 로고, 글자 크기, 요소 자리를 바꿉니다. 바꾼 것은 캔버스를 누른 뒤
              Ctrl+Z 로 한 번에 되돌립니다.
            </p>
            <span className="flex shrink-0 gap-1">
              {lines.length > 0 ? (
                <Button variant="ghost" size="sm" onClick={reset}>
                  새 대화
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                접기
              </Button>
            </span>
          </div>
          <div ref={listRef} className="max-h-[40vh] space-y-3 overflow-y-auto">
            {lines.map((line, index) => (
              <p
                key={index}
                className={cn(
                  'whitespace-pre-wrap',
                  line.kind === 'user' &&
                    'ml-8 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900',
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
          <div className="flex flex-wrap gap-1.5">
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
        </div>
      ) : null}
      {scope}
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <textarea
          aria-label="AI 비서에게 요청"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="예: 제목을 더 짧게, 강조를 '문과'에만 두고 표를 위로 올려줘"
          rows={1}
          maxLength={1000}
          className="h-9 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none"
        />
        {!open ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
            {isBusy ? '생각하는 중' : lines.length > 0 ? '기록' : '자주 쓰는 요청'}
          </Button>
        ) : null}
        {isBusy ? (
          <Button type="button" variant="secondary" size="sm" onClick={stop}>
            멈추기
          </Button>
        ) : (
          <Button type="submit" size="sm" disabled={!draft.trim()}>
            수정
          </Button>
        )}
      </form>
    </div>
  );
}
