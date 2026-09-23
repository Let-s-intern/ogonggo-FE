'use client';

import type { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';
import {
  EVENT_RESET_CLASSES,
  GRID_CLASSES,
  GRID_STYLE,
  useCalendarDate,
  weekdayLabel,
} from '../lib/calendar-grid';
import { toCalendarParam, type JobCalendarDateBasis } from '../lib/query';
import { CALENDAR_FIRST_DAY } from '../lib/week';
import { DayHoverCard } from './DayHoverCard';

/**
 * 한 칸에 그대로 다 그리는 최대 개수. 여기까지는 `+N`이 붙지 않는다(PRD 8.2).
 *
 * v6(`docs/asset/v6 공고달력/월간 보기.png`)에서 오른쪽에 날짜별 목록이 붙으며 격자가 좁아져
 * 한 줄이 3개가 됐다 — 두 줄이면 6개다. 20일 칸이 로고 5개와 `+4`다.
 */
const MAX_EVENTS_PER_DAY = 6;

/** 위를 넘긴 칸에서 실제로 그리는 로고 수. 남은 한 자리(6번째)를 `+N`이 차지한다. */
const EVENTS_BESIDE_MORE = 5;

/**
 * 날짜별로 묶어 그 칸에 넣을 이벤트를 만든다.
 *
 * `+N`을 FullCalendar 의 `dayMaxEvents`에 맡기지 않는 이유가 있다. 그 옵션은 숫자를 주면
 * `maxStackCnt`가 되고 `hiddenConsumes`가 `false`라 링크가 자리를 차지하지 않는다
 * (`@fullcalendar/daygrid` 의 `internal.js`) — 즉 "항상 N개를 그리고 넘치면 링크를 더 붙인다"
 * 뿐이라 **8개인 칸만 예외로 다 보여주는** 이 규칙을 표현할 수 없다. `dayMaxEvents={7}`로 두면
 * 8개인 칸이 `7개 + +1`이 되어 버린다. 그래서 자르는 일을 여기서 한다.
 *
 * `+N`도 이벤트 하나로 넣는다. 그래야 로고와 같은 자리 폭(1/3)을 받아 목업처럼 마지막
 * 6번째 칸에 앉는다. 순서는 `order`로 못 박는다 — FullCalendar 의 기본 정렬은 제목순이라
 * `+5` 같은 문자열이 로고들 사이로 끼어든다.
 */
function buildMonthEvents(
  items: UserJobCalendarItemResponse[],
  dateBasis: JobCalendarDateBasis,
): EventInput[] {
  const byDay = new Map<string, UserJobCalendarItemResponse[]>();
  for (const item of items) {
    const day = (dateBasis === 'start' ? item.recruitmentStartAt : item.recruitmentEndAt).slice(
      0,
      10,
    );
    byDay.set(day, [...(byDay.get(day) ?? []), item]);
  }

  const events: EventInput[] = [];
  for (const [day, dayItems] of byDay) {
    const overflowing = dayItems.length > MAX_EVENTS_PER_DAY;
    const visible = overflowing ? dayItems.slice(0, EVENTS_BESIDE_MORE) : dayItems;

    visible.forEach((item, index) => {
      events.push({
        id: String(item.id),
        title: item.companyName,
        start: day,
        allDay: true,
        extendedProps: { order: index, deadline: day },
      });
    });

    if (overflowing) {
      const hiddenCount = dayItems.length - EVENTS_BESIDE_MORE;
      events.push({
        id: `more-${day}`,
        title: `+${hiddenCount}`,
        start: day,
        allDay: true,
        extendedProps: { order: EVENTS_BESIDE_MORE, hiddenCount },
      });
    }
  }

  return events;
}

export interface MonthGridProps {
  /** 서버 컴포넌트가 받아 내려준 달력 항목. 여기서 다시 API를 부르지 않는다. */
  items: UserJobCalendarItemResponse[];
  /** 펼칠 달. `YYYY-MM-DD`. */
  initialDate: string;
  /** 오른쪽 목록이 보여 주는 날. 그 칸을 파란 판으로 칠한다. `YYYY-MM-DD`. */
  selectedDay: string;
  /** 날짜 칸을 누르면 그 날로 부른다. */
  onSelectDay: (day: string) => void;
  /** `마감일 기준` 토글 값. 날짜 칸을 묶는 필드를 정한다(`buildMonthEvents`). */
  dateBasis: JobCalendarDateBasis;
}

/**
 * 월간 격자(`docs/asset/공고달력.png`, v6 `docs/asset/v6 공고달력/월간 보기.png`). FullCalendar 는
 * 클라이언트 컴포넌트다(PRD 6.1) — 데이터는 위에서 props 로 받는다. 오른쪽 날짜별 목록과 고른
 * 날을 함께 쓰므로 그 상태는 위(`MonthCalendar`)가 들고 있다.
 *
 * 항목은 `dateBasis` 에 따라 **마감일(`recruitmentEndAt`) 또는 시작일(`recruitmentStartAt`)
 * 기준**으로 놓는다(`prd-calendar-date-basis-toggle.md`). 칸에 그리는 것은 회사 로고다 —
 * 달력 응답에 로고 URL 이 없어
 * `entities/job/ui/CompanyLogo`가 회사명으로 찾고, 못 찾거나 이미지가 실패하면 기본
 * 썸네일(`shared/ui/Thumbnail`)로 떨어진다.
 *
 * 헤더 툴바는 끈다 — 목업의 날짜 이동 줄(`< 2026.08 [달력] >`)은 FullCalendar 의 툴바와
 * 생김새가 달라 `CalendarHeader`가 따로 그린다.
 *
 * 스타일을 덮는 방법은 `../lib/calendar-grid`의 `GRID_CLASSES` 주석에 정리했다.
 */
export function MonthGrid({
  items,
  initialDate,
  selectedDay,
  onSelectDay,
  dateBasis,
}: MonthGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  useCalendarDate(calendarRef, initialDate);

  // 날짜 칸 클릭은 `dayCellDidMount` 에서 한 번 건다. FullCalendar 의 `dateClick` 은
  // `@fullcalendar/interaction` 플러그인이 있어야 하는데 날짜 누르기 하나 때문에 의존성을 더하지
  // 않는다. 칸은 달을 옮겨도 다시 마운트되지 않을 수 있어 콜백을 ref 로 들고 최신 것을 부른다.
  const onSelectDayRef = useRef(onSelectDay);
  useEffect(() => {
    onSelectDayRef.current = onSelectDay;
  });

  return (
    <div
      style={GRID_STYLE}
      className={[
        ...GRID_CLASSES,
        // 요일 머리글: 회색 소문자 라벨 한 줄.
        '[&_.fc-col-header-cell]:py-3 [&_.fc-col-header-cell]:text-xs',
        '[&_.fc-col-header-cell]:font-medium [&_.fc-col-header-cell-cushion]:text-gray-400',
        // 날짜 숫자: 굵은 검정, 앞뒤 달은 회색(PRD 5.3).
        '[&_.fc-daygrid-day-number]:text-sm [&_.fc-daygrid-day-number]:font-bold',
        '[&_.fc-daygrid-day-number]:text-gray-900',
        // 앞뒤 달은 회색이다(PRD 5.3). FullCalendar 는 `.fc-day-other .fc-daygrid-day-top`에
        // `opacity: .3`을 걸어 두는데, 그러면 목업보다 훨씬 흐려져 색만 바꿔서는 모자란다.
        '[&_.fc-day-other_.fc-daygrid-day-number]:text-gray-300',
        '[&_.fc-day-other_.fc-daygrid-day-top]:opacity-100!',
        // 날짜 숫자는 칸 가운데다(목업). FullCalendar 기본은 오른쪽 정렬이다.
        '[&_.fc-daygrid-day-top]:justify-center',
        // 오늘은 파란 글씨다(미니 달력과 같은 규칙).
        '[&_.fc-day-today_.fc-daygrid-day-number]:text-blue-500',
        // 오른쪽 목록이 보여 주는 날은 칸 안쪽을 `blue-00` 판으로 칠한다(v6, 22일 칸). 칸 전체가
        // 누를 곳이다.
        '[&_.fc-daygrid-day]:cursor-pointer',
        '[&_.ogonggo-selected-day_.fc-daygrid-day-frame]:rounded-lg',
        '[&_.ogonggo-selected-day_.fc-daygrid-day-frame]:bg-blue-00',
        // 앞뒤 달의 로고는 흐리게 둔다(v6 첫 줄 26~30일).
        '[&_.fc-day-other_.fc-daygrid-event-harness]:opacity-40',
        // 날짜 칸은 위에서부터 쌓는다 — 날짜 숫자가 맨 위, 그 아래 로고 타일이다.
        // 칸을 통째로 flex 로 만들었다가 두 가지가 어긋났다. 칸 높이는 그 주에서 가장 많은
        // 칸에 맞춰 늘어나는데 세로 가운데 정렬이 겹쳐 항목이 적은 칸일수록 내용이 아래로
        // 내려갔고, `display: contents` 로 편 항목들이 첫 줄 앞에 여백 한 칸(4px)을 더 만들어
        // 둘째 줄이 왼쪽으로 밀렸다. 타일을 담는 자리만 flex 로 두면 둘 다 생기지 않는다.
        '[&_.fc-daygrid-day-frame]:px-1 [&_.fc-daygrid-day-frame]:pt-5 [&_.fc-daygrid-day-frame]:pb-2',
        // 칸 높이. 내용에 맡기면 항목이 없는 주는 38px, 한 줄인 주는 98px, 두 줄인 주는 102px 로
        // 주마다 제각각이 되어 답답해 보였다. 목업의 한 주는 146px 이고(가로 구분선 사이,
        // `docs/asset/공고달력.png`) 이 화면은 목업보다 2.8% 좁으므로 144px 로 맞춘다.
        // 8개(두 줄)가 든 칸이 여유 있게 담기는 높이이기도 하다. `!` 가 붙은 이유는
        // `EVENT_RESET_CLASSES` 주석과 같다 — FullCalendar 가 여기에 `min-height: 100%` 를
        // 레이어 밖에서 걸어 둔다. Push 1 의 `min-h-[104px]` 가 아무 효과도 없던 것이 이것이다.
        '[&_.fc-daygrid-day-frame]:min-h-[144px]!',
        '[&_.fc-daygrid-day-events]:flex [&_.fc-daygrid-day-events]:flex-wrap',
        '[&_.fc-daygrid-day-events]:gap-1',
        // FullCalendar 가 이 자리에 걸어 둔 `min-height: 2em`·`margin-bottom: 1em` 을 지우고
        // 날짜 숫자와의 사이를 목업만큼 띄운다
        // (레이어 밖 규칙이라 `!` 가 필요하다 — `EVENT_RESET_CLASSES` 주석 참고).
        '[&_.fc-daygrid-day-events]:mt-3! [&_.fc-daygrid-day-events]:mb-0!',
        '[&_.fc-daygrid-day-events]:min-h-0!',
        // FullCalendar 는 이 자리에 float 를 걷어내려고 `::before`/`::after` clearfix 를
        // `display: table` 로 넣어 둔다. flex 컨테이너에서는 그게 폭 0짜리 항목 하나가 되어
        // **첫 줄만 여백 한 칸(4px)만큼 오른쪽으로 밀린다** — 둘째 줄과 왼쪽 끝이 어긋난다.
        '[&_.fc-daygrid-day-events::before]:hidden! [&_.fc-daygrid-day-events::after]:hidden!',
        // 한 줄에 3개까지다(v6). 칸 너비에 기대지 않고 자리 폭을 1/3로 못 박는다 —
        // 가로 여백 4px 두 칸(8px)에 반올림 여유를 더해 한 칸마다 4px 을 뺀다. 딱 맞게 잡으면
        // 소수점 반올림에서 한 개가 다음 줄로 밀린다.
        '[&_.fc-daygrid-event-harness]:basis-[calc(33.333%-4px)]',
      ].join(' ')}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        firstDay={CALENDAR_FIRST_DAY}
        headerToolbar={false}
        fixedWeekCount
        showNonCurrentDates
        height="auto"
        // 한 칸 안의 순서는 `buildMonthEvents`가 매긴 `order` 그대로다(기본값은 제목순).
        eventOrder="order"
        dayHeaderContent={(arg) => weekdayLabel(arg.date)}
        dayCellClassNames={(arg) =>
          toCalendarParam(arg.date) === selectedDay ? ['ogonggo-selected-day'] : []
        }
        dayCellDidMount={(arg) => {
          const day = toCalendarParam(arg.date);
          arg.el.addEventListener('click', () => onSelectDayRef.current(day));
        }}
        eventClassNames={EVENT_RESET_CLASSES}
        eventContent={(arg) => {
          const hiddenCount = arg.event.extendedProps.hiddenCount as number | undefined;
          if (hiddenCount !== undefined) {
            return (
              <span
                title={`${hiddenCount}건 더 있음`}
                className="flex h-7 items-center text-xs font-medium text-gray-400"
              >
                {arg.event.title}
              </span>
            );
          }
          // 로고에 마우스를 올리거나 포커스하면 이 날짜(마감일 또는 시작일)의 공고 목록이 뜬다
          // (`DayHoverCard`, PRD 3절). 예전에는 `title` 속성 한 줄 툴팁이었다.
          return (
            <DayHoverCard
              day={arg.event.extendedProps.deadline as string}
              items={items}
              dateBasis={dateBasis}
            >
              <span>
                {/*
                  `CompanyLogo` 의 기본 안쪽 여백(`p-1`)을 여기서만 없앤다. 28px 타일에서 4px 씩
                  빼면 그림이 들어갈 자리가 20px 밖에 남지 않아 로고가 상자 안에서 너무 작아
                  보였다(상자 넓이 대비 그림 넓이 평균 29.9%). `object-contain` 은 그대로 둔다 —
                  `object-cover` 로 채우면 마크가 치우친 로고에서 글자가 잘린다
                  (`entities/job/ui/CompanyLogo.tsx` 주석).
                */}
                <CompanyLogo companyName={arg.event.title} className="h-7 w-7 rounded-xs p-0" />
              </span>
            </DayHoverCard>
          );
        }}
        events={buildMonthEvents(items, dateBasis)}
      />
    </div>
  );
}
