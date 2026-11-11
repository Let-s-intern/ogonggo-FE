'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@ogonggo/ui';
import { CardGridSkeleton } from '@/shared/ui/CardGridSkeleton';

/** 이동 중인 쪽 하나를 더하고, 돌려받은 함수로 뺀다. */
const ReportContext = createContext<() => () => void>(() => () => {});
const PendingContext = createContext(false);

/**
 * 검색·필터·직무 칩이 주소를 바꾸는 동안 카드 자리에 스켈레톤을 보이게 하는 경계.
 *
 * 셋 다 `router.push` 를 transition 으로 감싸서(`JobFilterSidebar`, `JobRoleChips`) 응답이 올 때까지
 * 옛 목록이 그대로 남는다. 눌렀는지 알 수 없어 다시 누르게 된다. 각자 `useTransition` 을 그대로 두고
 * `isPending` 만 여기에 알린다 — transition 을 하나로 합치면 칩이 사이드바의 이동을 자기 이동으로
 * 읽는다(`lib/pendingFilter.ts` 의 `roleInFlight`).
 *
 * `isPending` 이 꺼지는 렌더가 새 목록을 그리는 렌더와 같아서 스켈레톤과 새 카드 사이에 빈 틈이 없다.
 */
export function JobListPendingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [report] = useState(() => () => {
    setCount((value) => value + 1);
    return () => setCount((value) => value - 1);
  });

  return (
    <ReportContext.Provider value={report}>
      <PendingContext.Provider value={count > 0}>{children}</PendingContext.Provider>
    </ReportContext.Provider>
  );
}

/** 이 쪽의 이동이 진행 중이면 목록에 알린다. */
export function useReportJobListPending(isPending: boolean) {
  const report = useContext(ReportContext);
  useEffect(() => (isPending ? report() : undefined), [isPending, report]);
}

/**
 * 공고 카드 자리. 이동 중에는 카드 위에 같은 크기의 스켈레톤(`loading.tsx` 와 같은 `animate-pulse`)을
 * 덮는다. 카드 수는 지금 쪽의 수를 따른다 — 마지막 쪽처럼 적은 쪽에서 12장을 그리면 아래가 출렁인다.
 *
 * 스켈레톤은 `loading.tsx` 처럼 300ms 뒤에 나타난다(`.ogonggo-fallback`, `app/globals.css`). 그래서 카드를
 * 빼지 않고 같은 칸에 겹쳐 둔다 — 빼면 그 300ms 동안 빈 칸이 된다. 카드는 그동안 흐려져 눌린 것만 알린다.
 */
export function JobListPendingArea({ count, children }: { count: number; children: ReactNode }) {
  const pending = useContext(PendingContext);

  return (
    <div aria-busy={pending} className="grid">
      <div
        className={cn(
          '[grid-area:1/1] transition-opacity',
          pending && 'pointer-events-none opacity-50',
        )}
      >
        {children}
      </div>
      {pending ? (
        // 지연 노출과 맥동은 둘 다 `animation` 이라 한 요소에 붙이면 지연 노출이 맥동을 덮는다.
        <div role="status" className="ogonggo-fallback bg-white [grid-area:1/1]">
          <span className="sr-only">불러오는 중</span>
          <div aria-hidden="true" className="ogonggo-skeleton animate-pulse">
            <CardGridSkeleton
              count={Math.max(count, 1)}
              gapClass="gap-x-4 gap-y-8"
              columnsClass="md:grid-cols-4 lg:grid-cols-3"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
