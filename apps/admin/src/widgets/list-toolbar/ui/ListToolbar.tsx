import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Button, Input } from '@ogonggo/ui';

export interface ListToolbarProps {
  children: ReactNode;
}

/** 목록 위 한 줄. 검색 상자와 필터 드롭다운이 여기 늘어선다. */
export function ListToolbar({ children }: ListToolbarProps) {
  return <div className="flex flex-wrap items-center gap-2 pb-4">{children}</div>;
}

export interface SearchBoxProps {
  /** URL 에 들어 있는 현재 검색어. */
  value: string;
  onSubmit: (keyword: string) => void;
  placeholder?: string;
}

/**
 * 검색 상자.
 *
 * 타이핑마다 URL 을 바꾸지 않는다. 글자 하나에 히스토리 항목이 하나씩 쌓여 뒤로 가기가
 * 망가지고, 요청도 글자 수만큼 나간다. 제출할 때 한 번만 바꾼다.
 *
 * 밖에서 들어온 `value` 가 바뀌면 입력칸도 따라간다 — 대시보드에서 조건이 걸린 채로 들어오거나
 * 뒤로 가기로 돌아왔을 때 상자가 비어 있으면 무엇으로 걸러진 목록인지 알 수 없다.
 */
export function SearchBox({ value, onSubmit, placeholder = '검색' }: SearchBoxProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(draft.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-64 text-sm"
        aria-label={placeholder}
      />
      <Button type="submit" size="sm" variant="secondary">
        검색
      </Button>
    </form>
  );
}
