'use client';

import type { SelectOption } from '@ogonggo/ui';
import { ListboxSelect } from './ListboxSelect';

export interface FormSelectProps {
  id: string;
  /** 목록의 접근성 이름. 칸 라벨과 같은 말이다. */
  label: string;
  /** 값이 빈 문자열인 줄이 있으면 그 줄을 안내 문구로 쓰고 목록에서는 뺀다. */
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** 빈 줄이 없을 때의 안내 문구. */
  placeholder?: string;
  className?: string;
}

/**
 * 작성 폼의 드롭다운. 네이티브 `select` 대신 사이트 디자인 드롭다운(`ListboxSelect`)을 쓴다(2026-11-09 사용자: biz 의
 * 드롭다운은 모두 직접 그린 것으로). 높이·모서리는 옆 `Input` 과 같다.
 *
 * 선택지 목록은 네이티브 `select` 시절 모양 그대로 받는다 — 첫 줄 `{ value: '', label: '…를 선택해 주세요.' }` 가
 * 안내 문구가 된다.
 */
export function FormSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = '선택해 주세요.',
  className = 'h-11 rounded-md',
}: FormSelectProps) {
  const empty = options.find((option) => option.value === '');
  return (
    <ListboxSelect
      id={id}
      label={label}
      placeholder={empty?.label ?? placeholder}
      value={value}
      options={options.filter((option) => option.value !== '')}
      onChange={onChange}
      className={className}
    />
  );
}
