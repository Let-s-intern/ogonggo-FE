'use client';

import { type KeyboardEvent, useId, useState } from 'react';
import { Button, cn, Input } from '@ogonggo/ui';

type LinkStyle = 'link' | 'card';

const STYLES: { value: LinkStyle; label: string; hint: string }[] = [
  { value: 'link', label: '링크로', hint: '글 속에 눌리는 글자로 보여요' },
  { value: 'card', label: '카드로', hint: '제목·이미지가 있는 미리보기로 보여요' },
];

function toHttpUrl(raw: string): string | null {
  const value = raw.trim();
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** `[글자](주소)`. 글자의 대괄호는 이스케이프하고, 괄호·공백이 든 주소는 `<…>` 로 감싼다. */
function markdownLink(label: string, url: string): string {
  const text = label.replace(/([\\[\]])/g, '\\$1');
  const target = /[\s()<>]/.test(url) ? `<${url}>` : url;
  return `[${text}](${target})`;
}

export interface LinkInsertPanelProps {
  /** 넣을 글을 커서 앞뒤 글을 보고 만든다. 1000 자를 넘으면 false 다. */
  onInsert: (makeText: (before: string, after: string) => string) => boolean;
  onClose: () => void;
}

/**
 * 답변 입력칸의 `링크 넣기`. 주소를 받아 `링크로`(글 속 눌리는 글자) 와 `카드로`(오픈그래프 미리보기) 중
 * 고른 모양의 마크다운을 커서 자리에 넣는다.
 *
 * - 링크: `[보일 글자](주소)`. 보일 글자를 비우면 주소가 그대로 보인다.
 * - 카드: 주소만 한 줄에 둔다. `MarkdownText` 가 주소만 쓴 줄을 카드로 그린다.
 */
export function LinkInsertPanel({ onInsert, onClose }: LinkInsertPanelProps) {
  const id = useId();
  const [style, setStyle] = useState<LinkStyle>('link');
  const [rawUrl, setRawUrl] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const insert = () => {
    const url = toHttpUrl(rawUrl);
    if (!url) {
      setError('주소를 확인해 주세요');
      return;
    }
    const inserted = onInsert((before, after) => {
      if (style === 'link') return markdownLink(label.trim() || url, url);
      const head = before === '' || before.endsWith('\n') ? '' : '\n';
      const tail = after === '' || after.startsWith('\n') ? '' : '\n';
      return `${head}${url}${tail}`;
    });
    if (!inserted) setError('1000자를 넘어서 넣을 수 없어요');
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      insert();
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-3">
      <div role="radiogroup" aria-label="링크 보이는 방식" className="flex gap-2">
        {STYLES.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={style === option.value}
            onClick={() => setStyle(option.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              style === option.value
                ? 'border-blue-600 bg-blue-50 font-semibold text-blue-600'
                : 'border-gray-300 text-gray-600 hover:text-gray-900',
            )}
          >
            {option.label}
          </button>
        ))}
        <span className="self-center text-xs text-gray-400">
          {STYLES.find((option) => option.value === style)?.hint}
        </span>
      </div>
      <label htmlFor={`${id}-url`} className="sr-only">
        주소
      </label>
      <Input
        id={`${id}-url`}
        autoFocus
        inputMode="url"
        placeholder="https://"
        value={rawUrl}
        onChange={(event) => {
          setRawUrl(event.target.value);
          setError(null);
        }}
        onKeyDown={onKeyDown}
      />
      {style === 'link' ? (
        <>
          <label htmlFor={`${id}-label`} className="sr-only">
            보일 글자
          </label>
          <Input
            id={`${id}-label`}
            placeholder="보일 글자 (비우면 주소가 그대로 보여요)"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        {error ? <span className="mr-auto text-xs text-red-500">{error}</span> : null}
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          닫기
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!rawUrl.trim()}
          onClick={insert}
        >
          넣기
        </Button>
      </div>
    </div>
  );
}
