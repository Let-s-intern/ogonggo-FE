'use client';

import * as Popover from '@radix-ui/react-popover';
import { useEffect, useRef, useState } from 'react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { formatJobField, JOB_ROLES } from '@/entities/job/model/labels';
import type { JobField, JobRole } from '@/entities/job/model/types';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';
import type { JobCalendarDateBasis } from '../lib/query';

/**
 * 미리보기에 그리는 최대 수. 두 열로 한눈에 훑을 만큼 두고 나머지는 `외 N건`으로 센다. 시작일
 * 기준에서는 한 날이 수백 건일 수 있어(운영, 2026-09-30) 다 그리면 올릴 때마다 멈추기도 한다.
 */
const MAX_PREVIEW_ITEMS = 30;

/** 미리보기 한 줄의 직무. 세부 직무가 있으면 그것, 없으면 직군, 둘 다 없으면 공고 제목이다. */
function jobLabel(item: UserJobCalendarItemResponse): string {
  const role = item.jobRole ? JOB_ROLES[item.jobRole as JobRole]?.label : undefined;
  return role ?? formatJobField(item.jobField as JobField | undefined) ?? item.title;
}

/** `YYYY-MM-DD…` → `9/25`. */
function shortDate(value: string): string {
  return `${Number(value.slice(5, 7))}/${Number(value.slice(8, 10))}`;
}

/**
 * 칸에서 나간 뒤 닫기까지 기다리는 시간. 옆 칸으로 옮겨 가는 사이에 카드가 닫혔다 다시 열리며
 * 깜빡이지 않게 한다 — 옆 칸에 들어오면 기다리던 닫기를 취소한다.
 */
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
 * 격자의 날짜 칸에 마우스를 올리면 그 날짜의 공고를 한 줄씩 훑어보게 띄우는 미리보기
 * (PRD 3절). 월간(`MonthGrid`)과 주간(`WeekGrid`)이 같이 쓴다.
 *
 * **카드는 날짜 칸 하나에 하나다.** 예전에는 로고(월간)·막대(주간)마다 카드가 붙어 있어 같은
 * 칸 안에서 옮겨 다닐 때마다 카드가 닫혔다 열렸다. 격자가 칸마다 `bindDayCell`로 마우스 출입을
 * 걸고, 카드 하나(`DayHoverPopover`)가 지금 올라간 칸을 앵커로 삼는다.
 *
 * 한 줄에 `로고 · 회사 · 직무 · 다른 기준 날짜`만 둔다. 호버한 날짜가 이미 기준 날짜(마감일
 * 기준이면 마감일)라, 날짜 칸에는 나머지 하나(시작일)를 적는다. 공고 제목은 빼고 두 열로 늘어놓아
 * 한 번에 많이 보이게 한다.
 *
 * **누를 수 없는 미리보기다.** 클릭하기 전에 어떤 공고가 있는지 빠르게 보려는 것이라, 카드는
 * 마우스를 받지 않고(`pointer-events-none`) 칸에서 나가면 닫힌다. 공고는 날짜를 눌러 오른쪽
 * 목록(`DayJobPanel`)에서 연다.
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
  const { hoveredDay, anchorRef, close } = hover;
  const dayItems = hoveredDay ? itemsOnDay(items, hoveredDay, dateBasis) : [];
  const basisLabel = dateBasis === 'start' ? '시작' : '마감';
  /** 줄마다 적는 나머지 날짜의 이름. 호버한 날짜가 기준 날짜라 반대쪽을 적는다. */
  const otherLabel = dateBasis === 'start' ? '마감' : '시작';

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
            // 마우스를 받지 않는다. 카드 밑의 칸들로 그대로 옮겨 가며 훑을 수 있다.
            className="pointer-events-none z-50 w-[36rem] max-w-[calc(100vw-2rem)] rounded-lg bg-white p-4 shadow-lg ring-1 ring-gray-200"
          >
            <p className="mb-2 px-1 text-xs font-medium text-gray-500">
              {hoveredDay.slice(0, 4)}.{hoveredDay.slice(5, 7)}.{hoveredDay.slice(8, 10)}{' '}
              {basisLabel} · {dayItems.length}건
            </p>
            <ul className="grid grid-cols-2 gap-x-4">
              {dayItems.slice(0, MAX_PREVIEW_ITEMS).map((item) => (
                <li key={item.id} className="flex min-w-0 items-center gap-2 px-1 py-1">
                  <CompanyLogo
                    companyName={item.companyName}
                    logoUrl={item.logoUrl}
                    className="h-5 w-5 shrink-0 rounded-xs p-0"
                  />
                  <span className="max-w-24 shrink-0 truncate text-xs font-semibold text-gray-900">
                    {item.companyName}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
                    {jobLabel(item)}
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {otherLabel}{' '}
                    {shortDate(
                      dateBasis === 'start' ? item.recruitmentEndAt : item.recruitmentStartAt,
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {dayItems.length > MAX_PREVIEW_ITEMS ? (
              <p className="px-1 pt-2 text-xs text-gray-400">
                외 {dayItems.length - MAX_PREVIEW_ITEMS}건 · 날짜를 누르면 전부 볼 수 있어요
              </p>
            ) : null}
          </Popover.Content>
        </Popover.Portal>
      ) : null}
    </Popover.Root>
  );
}
