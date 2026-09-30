'use client';

import { useRouter } from 'next/navigation';
import { useRef, type ReactNode, type TouchEvent } from 'react';

/** 넘기려면 가로로 이만큼은 밀어야 한다. 막대·로고를 누르다 조금 흔들린 것은 넘기지 않는다. */
const SWIPE_MIN_PX = 60;

export interface CalendarSwipeProps {
  /** 오른쪽으로 밀었을 때 갈 곳(이전 달·주). 위 `<` 화살표와 같은 주소다(`CalendarHeader`). */
  prevHref: string;
  /** 왼쪽으로 밀었을 때 갈 곳(다음 달·주). */
  nextHref: string;
  children: ReactNode;
}

/**
 * 모바일 공고 달력을 손가락으로 좌우로 밀어 이전·다음 달(간략히 보기는 주)로 넘긴다. 위의 작은
 * 화살표를 누르는 것과 같은 이동이다.
 *
 * 터치에만 반응해 데스크톱 마우스에는 아무 일도 하지 않는다. 가로로 `SWIPE_MIN_PX` 넘게, 세로보다
 * 확실히 더 많이 밀었을 때만 넘긴다 — 세로 스크롤이나 탭은 그대로다. 날짜 카드(`role="dialog"`)
 * 안에서 민 것은 넘기지 않는다. 그 카드는 이 안에 그려지지만 달력이 아니다.
 */
export function CalendarSwipe({ prevHref, nextHref, children }: CalendarSwipeProps) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    const inDialog = (event.target as HTMLElement).closest('[role="dialog"]');
    start.current =
      touch && event.touches.length === 1 && !inDialog
        ? { x: touch.clientX, y: touch.clientY }
        : null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const from = start.current;
    start.current = null;
    const touch = event.changedTouches[0];
    if (!from || !touch) return;
    const dx = touch.clientX - from.x;
    const dy = touch.clientY - from.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    router.push(dx < 0 ? nextHref : prevHref, { scroll: false });
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
}
