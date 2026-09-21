'use client';

import { useState, type ReactNode } from 'react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { parseCalendarDate, toCalendarParam } from '../lib/query';
import { DayJobPanel } from './DayJobPanel';
import { MonthGrid } from './MonthGrid';

/**
 * 처음 고르는 날. 보고 있는 달에 오늘이 있으면 오늘, 없으면 그 달 1일이다. 다른 달로 옮겼는데
 * 오늘을 고른 채로 두면 오른쪽 목록이 격자에 없는 날을 보여 준다.
 */
function defaultDay(initialDate: string): string {
  const base = parseCalendarDate(initialDate) ?? new Date();
  const today = new Date();
  const sameMonth =
    today.getFullYear() === base.getFullYear() && today.getMonth() === base.getMonth();
  return toCalendarParam(sameMonth ? today : new Date(base.getFullYear(), base.getMonth(), 1));
}

export interface MonthCalendarProps {
  items: UserJobCalendarItemResponse[];
  /** 펼칠 달. `YYYY-MM-DD`. */
  initialDate: string;
  /** 격자 위의 날짜 이동 줄(`CalendarHeader`). 격자와 같은 열에 놓인다. */
  header: ReactNode;
}

/**
 * 월간 보기(`docs/asset/v6 공고달력/월간 보기.png`) — 왼쪽 격자와 오른쪽 날짜별 공고 목록.
 *
 * 고른 날은 지역 상태다. URL 에 두면 날짜 하나 누를 때마다 서버가 달력을 다시 그리고 로딩 판이
 * 뜬다. 공유하거나 새로고침 뒤 되살릴 값도 아니다 — `WeekGrid`의 접힘과 같은 판단이다.
 *
 * 달을 옮기면 고른 날을 그 달의 기본값으로 되돌린다. 화살표 이동은 같은 라우트 안이라 이
 * 컴포넌트가 다시 마운트되지 않으므로 렌더 중에 맞춘다(`WeekGrid`와 같은 방법).
 */
export function MonthCalendar({ items, initialDate, header }: MonthCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(() => defaultDay(initialDate));
  const [renderedMonth, setRenderedMonth] = useState(initialDate);
  if (renderedMonth !== initialDate) {
    setRenderedMonth(initialDate);
    setSelectedDay(defaultDay(initialDate));
  }

  const jobIds = items
    .filter((item) => item.recruitmentEndAt.slice(0, 10) === selectedDay)
    .map((item) => item.id);

  return (
    // 목업의 격자는 791px, 목록은 290px, 사이는 40px 이다.
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,791fr)_minmax(0,290fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        {header}
        <MonthGrid
          items={items}
          initialDate={initialDate}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      </div>
      <DayJobPanel day={selectedDay} jobIds={jobIds} />
    </div>
  );
}
