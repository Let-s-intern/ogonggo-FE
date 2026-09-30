'use client';

import * as Popover from '@radix-ui/react-popover';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { DayJobCard } from './DayJobPanel';
import type { JobCalendarDateBasis } from '../lib/query';

export interface DayHoverCardProps {
  /** 카드가 보여줄 날. `YYYY-MM-DD`. `items`를 이 날로 거른다. */
  day: string;
  /**
   * 그 날의 후보 전체(달력이 받아 둔 전체 항목, 또는 격자가 이미 거른 목록). `dateBasis` 기준
   * 필드가 `day`와 같은 것만 카드에 남는다 — 호출부가 미리 하루치로 잘라 넘길 필요는 없다.
   */
  items: UserJobCalendarItemResponse[];
  /** `마감일 기준` 토글 값. `day`와 짝지어 필터링 기준 필드(마감일/시작일)를 정한다. */
  dateBasis: JobCalendarDateBasis;
  /** 카드를 띄우는 자리(주간 막대). 단일 엘리먼트여야 한다 — `Popover.Trigger`의 `asChild`. */
  children: ReactElement;
}

/** 트리거에서 카드로 마우스를 옮기는 동안(`sideOffset` 8px 틈) 카드를 닫지 않고 기다리는 시간. */
export const HOVER_CLOSE_DELAY_MS = 120;

/**
 * 마우스처럼 호버가 되는 기기인가. 터치 기기는 탭할 때도 `mouseenter`를 흉내 내 보내므로 이것으로
 * 걸러야 모바일에서 탭 한 번에 호버 카드가 함께 뜨지 않는다.
 */
export function canHover(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** `items` 중 `dateBasis` 기준 날짜가 `day`인 것. */
export function itemsOnDay(
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
 * 카드 본체(`Popover.Portal` + `Popover.Content`). `DayHoverCard`(주간 막대)와 `MonthGrid`(날짜 칸)가
 * 트리거·앵커만 달리 두고 같은 카드를 쓴다. `Popover.Root` 안에서 그려야 한다.
 */
export function DayHoverCardContent({
  day,
  dayItems,
  dateBasis,
  onMouseEnter,
  onMouseLeave,
}: {
  day: string;
  /** 이미 `day`로 거른 항목. */
  dayItems: UserJobCalendarItemResponse[];
  dateBasis: JobCalendarDateBasis;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const basisLabel = dateBasis === 'start' ? '시작' : '마감';
  return (
    <Popover.Portal>
      <Popover.Content
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        // 닫힐 때 포커스를 트리거로 되돌리지 않는다. 되돌리면 막대의 `onFocus`가 카드를 다시 열어
        // 마우스가 딴 데 있어도 카드가 남는다(간략히 보기에서 카드가 안 닫히던 원인).
        onCloseAutoFocus={(event) => event.preventDefault()}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="z-50 max-h-96 w-72 overflow-y-auto rounded-lg bg-white p-3 shadow-lg ring-1 ring-gray-200"
      >
        <p className="mb-2 px-1 text-xs font-medium text-gray-500">
          {day.slice(0, 4)}.{day.slice(5, 7)}.{day.slice(8, 10)} {basisLabel}
        </p>
        <ul className="flex flex-col gap-2">
          {dayItems.map((item, index) => (
            <li key={item.id}>
              <DayJobCard job={item} listPosition={index + 1} />
            </li>
          ))}
        </ul>
      </Popover.Content>
    </Popover.Portal>
  );
}

/**
 * 주간 격자의 막대에 마우스를 올리거나 포커스하면 그 날짜의 공고를
 * `DayJobCard` 목록으로 보여주는 카드(PRD 3절). `title` 속성 한 줄 툴팁을 대신한다.
 *
 * 포커스에서도 여는 이유는
 * `.claude/tasks/memos/결정-calendar-date-basis-toggle-push2-2026-09-23.md`에 있다 — 카드 **안**
 * (링크·북마크 버튼)까지 Tab으로 들어가는 동선은 이번 Push 범위 밖이고, 오른쪽 `DayJobPanel`이
 * 이미 같은 날짜의 항목을 키보드로 닿을 수 있는 자리에 나열해 둔다.
 *
 * 포커스는 키보드로 옮겼을 때(`:focus-visible`)만 연다. 막대를 눌러 상세 모달을 열었다 닫으면
 * 포커스가 막대로 돌아오는데, 그때 열면 마우스가 딴 데 있어도 카드가 남는다.
 *
 * `Popover.Trigger`에 `tabIndex={0}`을 주는 것은 트리거로 넘어오는 `children`이 원래 포커스를
 * 받지 않는 엘리먼트일 수 있어서다. Radix의 `Slot`은 자식이 이미 값을 갖고 있으면 자식 값을
 * 우선하므로, 이미 포커스 가능한 `Link`(주간 막대)에도 안전하게 얹을 수 있다.
 *
 * 열림 계기를 `Popover.Root`의 `open`/`onOpenChange`로 손수 관리하는 것은 Radix Popover가
 * 기본으로는 클릭에만 반응하기 때문이다. 막대에서 나갈 때는 잠깐 기다렸다 닫고, 그 사이
 * 카드(`Popover.Content`)로 들어오면 열린 채로 둔다 — 바로 닫으면 카드로 옮겨 가기 전에 닫힌다.
 */
export function DayHoverCard({ day, items, dateBasis, children }: DayHoverCardProps) {
  const [open, setOpen] = useState(false);
  const dayItems = itemsOnDay(items, day, dateBasis);

  const closeTimerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);
  const openOnHover = () => {
    if (!canHover()) return;
    window.clearTimeout(closeTimerRef.current);
    setOpen(true);
  };
  const keepOpen = () => window.clearTimeout(closeTimerRef.current);
  const closeSoon = () => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY_MS);
  };

  // 그 날 항목이 없으면(이론상 호출부가 이미 걸러 왔겠지만) 카드를 띄울 것이 없다 — 트리거만
  // 그대로 그린다.
  if (dayItems.length === 0) {
    return children;
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        asChild
        tabIndex={0}
        onMouseEnter={openOnHover}
        onMouseLeave={closeSoon}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
      >
        {children}
      </Popover.Trigger>
      <DayHoverCardContent
        day={day}
        dayItems={dayItems}
        dateBasis={dateBasis}
        onMouseEnter={keepOpen}
        onMouseLeave={closeSoon}
      />
    </Popover.Root>
  );
}
