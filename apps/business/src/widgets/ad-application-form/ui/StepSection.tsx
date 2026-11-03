import type { ReactNode } from 'react';
import { Button, cn } from '@ogonggo/ui';
import type { StepNumber } from '../model/form';

export interface StepSectionProps {
  n: StepNumber;
  title: string;
  description: string;
  open: boolean;
  /** 이 단계의 필수 값이 모두 찼는지. 머리의 번호 자리에 체크가 뜬다. */
  done: boolean;
  /** 접힌 머리 오른쪽의 한 줄 요약. */
  summary?: string;
  onToggle: () => void;
  /** 마지막 단계가 아니면 아래에 `다음` 이 붙는다. */
  onNext?: () => void;
  children: ReactNode;
}

/** 신청서 아코디언 한 칸(시안 B-04). 머리를 누르면 열고 닫는다. 한 번에 한 칸만 열린다. */
export function StepSection({
  n,
  title,
  description,
  open,
  done,
  summary,
  onToggle,
  onNext,
  children,
}: StepSectionProps) {
  const panelId = `ad-step-${n}`;
  return (
    <section className="rounded-md border border-gray-200 bg-white">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className={cn(
            'flex w-full items-center gap-3 px-5 py-4 text-left md:px-6',
            open && 'border-b border-gray-200',
          )}
        >
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
              open
                ? 'bg-blue-500 text-white'
                : done
                  ? 'bg-blue-50 text-blue-500'
                  : 'bg-gray-100 text-gray-500',
            )}
          >
            {done && !open ? (
              <span aria-label="완료" className="icon-[lucide--check] block h-4 w-4" />
            ) : (
              n
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-bold text-gray-900">{title}</span>
            <span className="truncate text-sm text-gray-500">
              {!open && summary ? summary : description}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'icon-[lucide--chevron-down] block h-5 w-5 shrink-0 text-gray-400 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
      </h2>
      {open ? (
        <div id={panelId} className="flex flex-col gap-6 px-5 py-6 md:px-6">
          {children}
          {onNext ? (
            <div className="flex justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={onNext}>
                다음 단계
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
