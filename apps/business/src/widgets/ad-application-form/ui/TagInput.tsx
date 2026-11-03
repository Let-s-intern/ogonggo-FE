'use client';

import { type KeyboardEvent, useState } from 'react';
import { Input } from '@ogonggo/ui';

export interface TagInputProps {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  max: number;
  placeholder: string;
}

/** 입력 후 Enter 로 칩을 더하는 칸(시안 `입력 후 Enter`). 같은 말은 한 번만, 최대 개수까지. */
export function TagInput({ id, tags, onChange, max, placeholder }: TagInputProps) {
  const [text, setText] = useState('');
  const full = tags.length >= max;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const value = text.trim();
    if (!value || full || tags.includes(value)) return;
    onChange([...tags, value]);
    setText('');
  };

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pr-1.5 pl-3 text-sm text-blue-600"
            >
              {tag}
              <button
                type="button"
                aria-label={`${tag} 지우기`}
                onClick={() => onChange(tags.filter((each) => each !== tag))}
                className="rounded-full p-0.5 hover:bg-blue-100"
              >
                <span aria-hidden="true" className="icon-[lucide--x] block h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Input
        id={id}
        value={text}
        disabled={full}
        maxLength={30}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={full ? `최대 ${max}개까지 넣었어요` : placeholder}
      />
    </div>
  );
}
