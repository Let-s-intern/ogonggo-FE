import { cn } from '@ogonggo/ui';
import type { ReactNode } from 'react';

export interface CalendarPanelProps {
  children: ReactNode;
  className?: string;
}

/**
 * 달력 자리에 격자 대신 들어가는 둥근 판(v6). 관심 직무 선택과 로딩이 같은 판을 쓴다
 * (`docs/asset/v6 공고달력/관심직무 선택.png`, `로딩.png`).
 *
 * 목업의 판은 위쪽 `blue-00`(245,249,255)에서 아래로 흰색이 되는 그라데이션이고 모서리가 16px 다.
 */
export function CalendarPanel({ children, className }: CalendarPanelProps) {
  return (
    <section
      className={cn(
        'flex w-full flex-col rounded-2xl bg-gradient-to-b from-blue-00 to-white',
        className,
      )}
    >
      {children}
    </section>
  );
}
