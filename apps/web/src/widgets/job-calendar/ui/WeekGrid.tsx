'use client';

import type { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { cn } from '@ogonggo/ui';
import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import {
  EVENT_RESET_CLASSES,
  GRID_CLASSES,
  GRID_STYLE,
  useCalendarDate,
  weekdayLabel,
} from '../lib/calendar-grid';
import { toCalendarParam } from '../lib/query';
import { CALENDAR_FIRST_DAY } from '../lib/week';

/**
 * 주간 뷰의 막대. 공고 하나가 가로 막대 하나이고 **모집 시작일부터 마감일까지** 걸친다
 * (PRD 5.2). FullCalendar 의 `end`는 열린 구간이라 마감일 다음 날을 넣어야 마감일 칸까지
 * 칠해진다. 주 경계에서 자르는 일은 FullCalendar 가 한다 — 보이는 범위 밖은 그리지 않는다.
 *
 * 시작일이 없는 공고(`recruitmentStartAt`이 마감일과 같은 값으로 채워져 오는 경우가 대부분이다,
 * `packages/api/src/mocks/handlers.ts`)는 하루짜리 막대가 된다.
 *
 * **`+N`은 주간에 없다**(2026-09-02 결정, PRD 가 정하지 않은 부분이다). 월간의 `+N`은 날짜
 * 칸이 로고 4개씩 두 줄로 크기가 정해진 상자라서 필요한 것인데, 주간의 막대는 한 줄을 통째로
 * 쓰고 아래로 얼마든지 쌓이므로 자를 이유가 없다. 게다가 막대는 여러 날에 걸치므로 "몇 건이
 * 가려졌다"를 어느 날짜 칸에 적을지 정할 수가 없다 — FullCalendar 의 `dayMaxEvents`도 주간에
 * 켜면 가려진 줄에 걸친 모든 요일 칸마다 `+N` 링크를 하나씩 만든다. 목업
 * (`docs/asset/공고달력 간략히.png`)에도 `+N`이 없고 막대 아래는 그냥 빈 자리다.
 */
function buildWeekEvents(items: UserJobCalendarItemResponse[]): EventInput[] {
  return items.map((item) => {
    const deadline = item.recruitmentEndAt.slice(0, 10);
    const start = item.recruitmentStartAt.slice(0, 10);
    return {
      id: String(item.id),
      title: item.companyName,
      start: start <= deadline ? start : deadline,
      end: exclusiveEnd(deadline),
      allDay: true,
      extendedProps: { deadline },
    };
  });
}

/** `YYYY-MM-DD`의 다음 날. FullCalendar 의 `end`가 열린 구간이라 하루를 더해야 한다. */
function exclusiveEnd(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  const next = new Date(year!, month! - 1, date! + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

/**
 * 막대에서 FullCalendar 기본 껍데기를 벗기는 클래스. 벗기는 이유는 `EVENT_RESET_CLASSES`
 * 주석과 같고, 모서리까지 지우는 것은 색과 둥근 정도를 안쪽 막대가 갖기 때문이다.
 *
 * 막대 사이 간격은 여기가 아니라 막대 내용의 아래 여백으로 만든다. FullCalendar 는 줄을
 * 쌓을 자리를 harness 의 `getBoundingClientRect().height`로 재는데(`querySegHeights`)
 * margin 은 그 값에 안 들어가서, margin 으로 띄우면 여러 날에 걸친 막대끼리 겹친다.
 */
const EVENT_BAR_CLASSES = [...EVENT_RESET_CLASSES, 'rounded-none!'];

export interface WeekGridProps {
  /** 서버 컴포넌트가 받아 내려준 달력 항목. 여기서 다시 API를 부르지 않는다. */
  items: UserJobCalendarItemResponse[];
  /** 펼칠 주에 든 아무 날짜. `YYYY-MM-DD`. */
  initialDate: string;
}

/**
 * 주간 격자(`docs/asset/공고달력 간략히.png`). `간략히 보기`가 켜졌을 때 월간 대신 그려진다
 * (PRD 8.1). 월간과 같은 라이브러리를 감싸지만 렌더 규칙이 전혀 달라 컴포넌트가 갈린다 —
 * 월간은 마감일 칸에 로고와 `+N`, 주간은 시작일부터 마감일까지 이어지는 가로 막대다.
 *
 * 주간은 날짜 칸이 상자가 아니다. 요일·날짜 머리글과 그 아래 가로선 하나가 전부이고, 막대는
 * 칸 경계를 무시하고 걸친 날 수만큼 이어진다. 그래서 월간이 칸에 준 안쪽 여백과 최소 높이를
 * 여기서는 전부 0 으로 되돌린다.
 *
 * 날짜 숫자는 머리글 안에 직접 그린다. `dayGridWeek` 은 줄이 하나뿐이라 FullCalendar 가
 * 칸 안의 날짜 숫자를 아예 렌더하지 않는다(`showDayNumbers: rowCnt > 1`).
 *
 * 스타일을 덮는 방법은 `../lib/calendar-grid`의 `GRID_CLASSES` 주석에 정리했다.
 */
export function WeekGrid({ items, initialDate }: WeekGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  useCalendarDate(calendarRef, initialDate);

  // 막대 색을 가르는 기준(PRD 8.3). 조회 범위가 이 주 7일이라 그려진 막대는 전부 "이번 주
  // 마감"이고, 그 중 마감일이 오늘인 것만 파랑이다. FullCalendar 의 `arg.isToday` 로는 안
  // 된다 — 그건 막대가 오늘을 지나가는지이지 오늘 끝나는지가 아니다.
  const today = toCalendarParam(new Date());

  return (
    <div
      style={GRID_STYLE}
      className={[
        ...GRID_CLASSES,
        // 머리글이 두 줄이라(`MON` 아래 날짜) 아래로 자리를 더 준다. 목업에서 날짜 줄 아래
        // 가로선까지가 22px 이고, 쿠션(`a.fc-col-header-cell-cushion`)이 이미 2px 을 갖고 있어
        // 20px 을 더하면 23px 이 된다. `!` 가 붙은 이유는 `EVENT_RESET_CLASSES` 주석과 같다 —
        // FullCalendar 가 `th` 의 안쪽 여백을 레이어 밖에서 0 으로 잡아 둔다. 위쪽은 건드리지
        // 않는다. 월간과 같은 자리에서 `MON` 이 시작해야 뷰를 오갈 때 머리글이 튀지 않는다.
        '[&_.fc-col-header-cell]:pb-5!',
        // 막대가 칸 끝에서 끝까지 가야 한다. 목업의 막대 왼쪽 끝(x=160)이 격자 왼쪽 끝과 같다.
        '[&_.fc-daygrid-day-frame]:p-0!',
        // 머리글 아래 가로선과 첫 막대 사이는 목업에서 12px 이다. FullCalendar 기본값은 1px 이고
        // `min-height: 2em`·`margin-bottom: 1em` 이 함께 붙어 있어 셋 다 덮는다.
        '[&_.fc-daygrid-day-events]:mt-3! [&_.fc-daygrid-day-events]:mb-0!',
        '[&_.fc-daygrid-day-events]:min-h-0!',
      ].join(' ')}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin]}
        initialView="dayGridWeek"
        initialDate={initialDate}
        firstDay={CALENDAR_FIRST_DAY}
        headerToolbar={false}
        height="auto"
        // 먼저 시작하고 긴 막대가 위로 온다. 줄을 쌓는 일은 FullCalendar 가 한다.
        eventOrder="start,-duration,title"
        dayHeaderContent={(arg) => (
          // 머리글은 `MON` 아래 날짜 두 줄이고 오늘은 파란 숫자다(PRD 5.2). 두 줄 사이는
          // 목업 실측 26px 이다.
          <span className="flex flex-col items-center gap-[26px]">
            <span className="text-xs font-medium text-gray-400">{weekdayLabel(arg.date)}</span>
            <span className={cn('text-sm font-bold', arg.isToday ? 'text-blue-500' : 'text-gray-900')}>
              {arg.date.getDate()}
            </span>
          </span>
        )}
        eventClassNames={EVENT_BAR_CLASSES}
        eventContent={(arg) => (
          // 아래 여백이 막대 사이 간격이다. margin 이 아닌 이유는 `EVENT_BAR_CLASSES` 주석에
          // 있다. 라벨은 기업명이고 칸을 넘치면 말줄임이다(PRD 5.2).
          <span className="block pb-2">
            <span
              className={cn(
                'block h-9 truncate rounded-[6px] px-3 text-sm leading-9 text-gray-800',
                // 목업 실측값 그대로다 — 파랑 막대가 `blue-50`(235,241,255), 회색 막대가
                // `gray-100`(243,244,246)이고 글자색은 둘 다 `gray-800`(31,41,55)이다.
                arg.event.extendedProps.deadline === today ? 'bg-blue-50' : 'bg-gray-100',
              )}
            >
              {arg.event.title}
            </span>
          </span>
        )}
        events={buildWeekEvents(items)}
      />
    </div>
  );
}
