'use client';

import { type KeyboardEvent, useState } from 'react';
import { Input } from '@ogonggo/ui';

/** `CreateRecruitmentPostRequest.technologyStacks` 의 `@maxItems`. */
const MAX_STACKS = 20;

export interface TechnologyStackInputProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * 기술 스택 칸(목업 `기술을 검색하거나 직접 입력해 주세요.`).
 *
 * 검색은 붙이지 않는다 — 고를 기술 목록을 주는 API 가 없다. 직접 입력만 받고, Enter 나 쉼표로
 * 한 개씩 담는다. 스무 개가 상한이고 그 이상은 받지 않는다(생성 타입 `@maxItems 20`).
 */
export function TechnologyStackInput({ id, value, onChange }: TechnologyStackInputProps) {
  const [draft, setDraft] = useState('');
  const full = value.length >= MAX_STACKS;

  const add = () => {
    const stack = draft.trim();
    if (!stack || full || value.includes(stack)) {
      setDraft('');
      return;
    }
    onChange([...value, stack]);
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      // Enter 가 폼 제출로 새는 것을 막는다. 이 칸의 Enter 는 "한 개 담기" 다.
      event.preventDefault();
      add();
      return;
    }
    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <Input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        disabled={full}
        placeholder={
          full ? `기술 스택은 ${MAX_STACKS}개까지 담을 수 있어요.` : '기술을 직접 입력해 주세요.'
        }
      />
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2 pt-2">
          {value.map((stack) => (
            <li
              key={stack}
              className="flex items-center gap-1 rounded-full bg-gray-100 py-1 pr-1 pl-3 text-sm text-gray-700"
            >
              {stack}
              <button
                type="button"
                aria-label={`${stack} 빼기`}
                onClick={() => onChange(value.filter((item) => item !== stack))}
                className="flex size-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <span aria-hidden="true" className="icon-[lucide--x] block size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
