import type { ReactNode } from 'react';
import type { Fact } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';

/** 값이 없을 때 시안이 쓰는 글(`docs/asset/v12 채용공고 상세/상세 기본.webp` 의 급여·마감). */
export const NO_VALUE_TEXT = '공고에 명시 없음';

/** 라벨과 값이 한 줄로 놓이는 `근무 조건`·`지원 서류 및 전형 절차` 의 행. 부모는 `<dl>` 이다. */
export function Condition({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-8 shrink-0 text-xs leading-5 text-gray-400">{label}</dt>
      <dd className="min-w-0 text-gray-900">{children}</dd>
    </div>
  );
}

/** 응답은 값이 없을 때 빈 문자열이나 `null` 을 모두 줄 수 있어 글자가 있는 것만 값으로 친다. */
export function factValue(fact?: Fact | null): string | null {
  return fact?.value?.trim() || null;
}

export function factNote(fact?: Fact | null): string | null {
  return fact?.note?.trim() || null;
}

/** 값이나 보충 설명 중 하나라도 있는지. */
export function hasFact(fact?: Fact | null): boolean {
  return factValue(fact) !== null || factNote(fact) !== null;
}

/**
 * `analysis` 의 `{ value, note }` 하나. 값이 있으면 값을, 없으면 회색 `공고에 명시 없음` 을 그리고,
 * 보충 설명(`note`)이 있으면 값 옆에 작은 글로 붙인다. 좁은 화면에서는 보충 설명이 아래 줄로 내려간다.
 * `noteClassName` 은 보충 설명의 색을 정한다(기본 회색, 마감·전형은 시안처럼 파랑).
 */
export function FactText({ fact, noteClassName }: { fact?: Fact | null; noteClassName?: string }) {
  const value = factValue(fact);
  const note = factNote(fact);

  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      {value ? <span>{value}</span> : <span className="text-gray-400">{NO_VALUE_TEXT}</span>}
      {note ? <span className={cn('text-xs text-gray-400', noteClassName)}>{note}</span> : null}
    </p>
  );
}
