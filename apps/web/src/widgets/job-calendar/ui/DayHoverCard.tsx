'use client';

import * as Popover from '@radix-ui/react-popover';
import { useEffect, useRef, useState } from 'react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { DayJobCard } from './DayJobPanel';
import type { JobCalendarDateBasis } from '../lib/query';

/**
 * 카드에 그리는 최대 수. 시작일 기준에서는 한 날이 수백 건일 수 있어(운영, 2026-09-30) 다
 * 그리면 올릴 때마다 멈춘다. 나머지는 `외 N건`으로 센다.
 */
const MAX_CARD_ITEMS = 20;

/** 칸에서 카드로 마우스를 옮기는 동안(`sideOffset` 8px 틈) 카드를 닫지 않고 기다리는 시간. */
const HOVER_CLOSE_DELAY_MS = 120;

/**
 * 마우스처럼 호버가 되는 기기인가. 터치 기기는 탭할 때도 `mouseenter`를 흉내 내 보내므로 이것으로
 * 걸러야 모바일에서 탭 한 번에 호버 카드가 함께 뜨지 않는다.
 */
function canHover(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** `items` 중 `dateBasis` 기준 날짜가 `day`인 것. */
function itemsOnDay(
  items: UserJobCalendarItemResponse[],
  day: string,
  dateBasis: JobCalendarDateBasis,
): UserJobCalendarItemResponse[] {
  return items.filter(
    (item) =>
      (dateBasis === 'start' ? item.recruitmentStartAt : item.recruitmentEndAt).slice(0, 10) ===
      day,
  );
}

/**
 * 격자의 날짜 칸에 마우스를 올리면 그 날짜의 공고를 `DayJobCard` 목록으로 띄우는 카드
 * (PRD 3절). 월간(`MonthGrid`)과 주간(`WeekGrid`)이 같이 쓴다.
 *
 * **카드는 날짜 칸 하나에 하나다.** 예전에는 로고(월간)·막대(주간)마다 카드가 붙어 있어 같은
 * 칸 안에서 옮겨 다닐 때마다 카드가 닫혔다 열렸다. 격자가 칸마다 `bindDayCell`로 마우스 출입을
 * 걸고, 카드 하나(`DayHoverPopover`)가 지금 올라간 칸을 앵커로 삼는다.
 *
 * 칸에서 나갈 때는 잠깐 기다렸다 닫고, 그 사이 카드로 들어오면 열린 채로 둔다 — 바로 닫으면
 * 카드로 옮겨 가기 전에 닫힌다.
 */
export function useDayHover() {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  const keepOpen = () => window.clearTimeout(closeTimerRef.current);
  const closeSoon = () => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setHoveredDay(null), HOVER_CLOSE_DELAY_MS);
  };

  /**
   * FullCalendar 의 `dayCellDidMount`에서 부른다. 칸은 FullCalendar 가 그린 DOM 이라 React
   * 핸들러를 달 수 없어 리스너를 직접 건다. 여기 쓰이는 것은 ref 와 상태 설정 함수뿐이라 칸이
   * 첫 렌더의 함수를 붙들고 있어도 된다.
   */
  const bindDayCell = (el: HTMLElement, day: string) => {
    el.addEventListener('mouseenter', () => {
      if (!canHover()) return;
      keepOpen();
      anchorRef.current = el;
      setHoveredDay(day);
    });
    el.addEventListener('mouseleave', closeSoon);
  };

  return {
    hoveredDay,
    anchorRef,
    keepOpen,
    closeSoon,
    bindDayCell,
    close: () => setHoveredDay(null),
  };
}

export interface DayHoverPopoverProps {
  hover: ReturnType<typeof useDayHover>;
  /** 격자가 그리고 있는 항목 전체. 올라간 날로 여기서 거른다. */
  items: UserJobCalendarItemResponse[];
  /** `마감일 기준` 토글 값. 거르는 기준 필드(마감일/시작일)를 정한다. */
  dateBasis: JobCalendarDateBasis;
  /**
   * 칸의 어느 쪽에 띄울지. 월간 칸은 짧아 아래(`bottom`)고, 주간 칸은 막대가 쌓여 세로로 길어
   * 옆(`right`)이다 — 아래에 두면 카드가 칸 맨 아래로 떨어진다.
   */
  side: 'bottom' | 'right';
}

export function DayHoverPopover({ hover, items, dateBasis, side }: DayHoverPopoverProps) {
  const { hoveredDay, anchorRef, keepOpen, closeSoon, close } = hover;
  const dayItems = hoveredDay ? itemsOnDay(items, hoveredDay, dateBasis) : [];
  const basisLabel = dateBasis === 'start' ? '시작' : '마감';

  return (
    <Popover.Root
      open={hoveredDay !== null && dayItems.length > 0}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Popover.Anchor virtualRef={anchorRef} />
      {hoveredDay ? (
        <Popover.Portal>
          <Popover.Content
            side={side}
            align="start"
            sideOffset={8}
            onOpenAutoFocus={(event) => event.preventDefault()}
            // 앵커가 칸이라 돌려줄 트리거가 없다. 포커스를 옮기지 않는다.
            onCloseAutoFocus={(event) => event.preventDefault()}
            onMouseEnter={keepOpen}
            onMouseLeave={closeSoon}
            className="z-50 max-h-96 w-72 overflow-y-auto rounded-lg bg-white p-3 shadow-lg ring-1 ring-gray-200"
          >
            <p className="mb-2 px-1 text-xs font-medium text-gray-500">
              {hoveredDay.slice(0, 4)}.{hoveredDay.slice(5, 7)}.{hoveredDay.slice(8, 10)}{' '}
              {basisLabel}
            </p>
            <ul className="flex flex-col gap-2">
              {dayItems.slice(0, MAX_CARD_ITEMS).map((item, index) => (
                <li key={item.id}>
                  <DayJobCard job={item} listPosition={index + 1} />
                </li>
              ))}
              {dayItems.length > MAX_CARD_ITEMS ? (
                <li className="px-1 text-xs text-gray-500">
                  외 {dayItems.length - MAX_CARD_ITEMS}건
                </li>
              ) : null}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      ) : null}
    </Popover.Root>
  );
}
