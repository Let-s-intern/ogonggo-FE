'use client';

import type { ReactNode } from 'react';
import { cn } from '@ogonggo/ui';
import { ChevronIcon } from '@/shared/ui/icons';

export interface FormSectionProps {
  /** 제목 왼쪽 동그라미 안의 숫자. 목업의 1·2·3 이다. */
  step: number;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * 작성 폼의 아코디언 한 단(목업 `사이드 프로젝트 스터디 모집글 작성.png`). 세 단이 같은
 * 모양이라 여기 한 번만 적는다.
 *
 * 접혀도 값은 그대로 있다 — 내용을 `hidden` 으로 감추기만 하고 언마운트하지 않는다. 마운트를
 * 끊으면 1 단을 접었다 펴는 사이에 입력이 사라진다.
 */
export function FormSection({
  step,
  title,
  description,
  open,
  onToggle,
  children,
}: FormSectionProps) {
  const bodyId = `recruitment-post-form-section-${step}`;

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
        <ChevronIcon
          direction={open ? 'up' : 'down'}
          className="size-5 shrink-0 text-gray-400"
        />
      </button>
      <div id={bodyId} className={cn('border-t border-gray-100 px-6 py-5', !open && 'hidden')}>
        {children}
      </div>
    </section>
  );
}
