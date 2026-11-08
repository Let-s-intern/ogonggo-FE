'use client';

import type { ReactNode } from 'react';
import { cn } from '@ogonggo/ui';
import { ChevronIcon } from '@/shared/ui/icons';

export interface FormSectionProps {
  /** 본문 요소의 id 앞머리. 한 화면에 폼이 둘 있어도 id 가 겹치지 않게 한다. */
  name: string;
  /** 제목 왼쪽 동그라미 안의 숫자. 목업의 1·2·3 이다. */
  step: number;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * 작성 폼의 아코디언 한 단(목업 `채용공고 등록.png`, `교육 부트캠프 공고 등록.png`).
 *
 * 접혀도 값은 그대로 있다 — 내용을 `hidden` 으로 감추기만 하고 언마운트하지 않는다. 마운트를
 * 끊으면 1 단을 접었다 펴는 사이에 입력이 사라진다.
 *
 * 채용공고 폼(v5 PRD 3 절) 이 먼저 쓰고 부트캠프 폼(4 절) 이 같은 모양을 쓰게 되어 여기로
 * 옮겼다. 둘이 같은 단을 다르게 그릴 이유가 없고, 한쪽만 고치면 두 폼의 생김새가 갈린다
 * (`결정-기업-마이페이지-push3-2026-09-21.md` 2 절이 이 시점을 옮길 때로 적었다).
 *
 * v4 모집글 폼에도 같은 모양의 단(`features/recruitment-post-form/ui/FormSection.tsx`) 이
 * 있다. 그쪽은 건드리지 않는다 — 이 Push 가 요청받은 변경이 아니다.
 */
export function FormSection({
  name,
  step,
  title,
  description,
  open,
  onToggle,
  children,
}: FormSectionProps) {
  const bodyId = `${name}-section-${step}`;

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center gap-3 px-6 py-5 text-left"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
          {step}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-gray-900">{title}</span>
          <span className="block pt-0.5 text-xs text-gray-400">{description}</span>
        </span>
        <ChevronIcon direction={open ? 'up' : 'down'} className="size-5 shrink-0 text-gray-400" />
      </button>
      <div id={bodyId} className={cn('border-t border-gray-100 px-6 py-5', !open && 'hidden')}>
        {children}
      </div>
    </section>
  );
}
