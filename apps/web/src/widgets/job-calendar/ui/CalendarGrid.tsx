'use client';

import dayGridPlugin from '@fullcalendar/daygrid';
import type { CSSProperties } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';

/** 목업의 요일 머리글은 `MON`~`SUN`이다. FullCalendar 기본값은 로케일 약어라 직접 넘긴다. */
const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** 격자의 첫 요일(월요일). `JobCalendarView`의 조회 범위 계산과 같은 값이어야 한다. */
const FIRST_DAY = 1;

export interface CalendarGridProps {
  /** 서버 컴포넌트가 받아 내려준 달력 항목. 여기서 다시 API를 부르지 않는다. */
  items: UserJobCalendarItemResponse[];
  /** 펼칠 달. `YYYY-MM-DD`. */
  initialDate: string;
}

/**
 * 월간 격자(`docs/asset/공고달력.png`). FullCalendar 는 클라이언트 컴포넌트다(PRD 6.1) —
 * 데이터는 위에서 props 로 받는다.
 *
 * 항목은 **마감일(`recruitmentEndAt`) 기준**으로 놓는다. 모집 시작일은 월간 뷰에서 쓰지
 * 않는다(PRD 8.2). 칸에 그리는 것은 회사 로고다 — 달력 응답에 로고 URL 이 없어
 * `entities/job/ui/CompanyLogo`가 회사명으로 찾고, 못 찾거나 이미지가 실패하면 기본
 * 썸네일(`shared/ui/Thumbnail`)로 떨어진다.
 *
 * 헤더 툴바는 끈다 — 목업의 날짜 이동 줄(`< 2026.08 [달력] >`)은 FullCalendar 의 툴바와
 * 생김새가 달라 Push 2 가 따로 그린다.
 *
 * 스타일은 FullCalendar 가 스스로 주입하는 기본 CSS 위에 저장소 토큰으로 덮는다. 전역
 * 스타일시트를 건드리지 않으려고 임의 변형 선택자(`[&_.fc-...]`)로 이 컴포넌트 안에만
 * 적용한다 — `MiniCalendarPopover`가 `classNames`로 하는 것과 같은 이유다.
 */
export function CalendarGrid({ items, initialDate }: CalendarGridProps) {
  return (
    <div
      // FullCalendar 가 CSS 변수로 내놓는 색은 변수로 덮는다 — 선택자 명시도 싸움을 안 해도 된다.
      style={
        {
          '--fc-border-color': 'var(--color-gray-200)',
          '--fc-today-bg-color': 'transparent',
        } as CSSProperties
      }
      className={[
        'w-full',
        // 세로 선은 목업에 없다. 가로 선만 남긴다.
        '[&_.fc-scrollgrid]:border-0',
        '[&_.fc-theme-standard_td]:border-x-0 [&_.fc-theme-standard_th]:border-x-0',
        // 요일 머리글: 회색 소문자 라벨 한 줄.
        '[&_.fc-col-header-cell]:py-3 [&_.fc-col-header-cell]:text-xs',
        '[&_.fc-col-header-cell]:font-medium [&_.fc-col-header-cell-cushion]:text-gray-400',
        // 날짜 숫자: 굵은 검정, 앞뒤 달은 회색(PRD 5.3).
        '[&_.fc-daygrid-day-number]:px-0 [&_.fc-daygrid-day-number]:py-2',
        '[&_.fc-daygrid-day-number]:text-sm [&_.fc-daygrid-day-number]:font-bold',
        '[&_.fc-daygrid-day-number]:text-gray-900',
        '[&_.fc-day-other_.fc-daygrid-day-number]:text-gray-300',
        '[&_.fc-day-other]:opacity-100',
        // 날짜 숫자는 칸 가운데다(목업). FullCalendar 기본은 오른쪽 정렬이다.
        '[&_.fc-daygrid-day-top]:justify-center',
        // 오늘은 파란 글씨다(미니 달력과 같은 규칙).
        '[&_.fc-day-today_.fc-daygrid-day-number]:text-blue-500',
        '[&_.fc-daygrid-day-frame]:min-h-[104px]',
        // 항목은 로고 타일이다 — 한 줄에 4개까지 깔리도록 이벤트 자리를 flex 로 바꾼다(PRD 5.3).
        '[&_.fc-daygrid-day-events]:mt-0 [&_.fc-daygrid-day-events]:flex',
        '[&_.fc-daygrid-day-events]:flex-wrap [&_.fc-daygrid-day-events]:gap-1',
        // FullCalendar 기본 이벤트 껍데기(테두리·배경·여백)를 지운다. 클래스를 두 번 적어
        // 명시도를 올린 것은 이 라이브러리가 CSS 를 런타임에 <head> 로 주입해 뒤에 오기 때문이다.
        '[&_.fc-daygrid-event-harness.fc-daygrid-event-harness]:mt-0',
        '[&_.fc-daygrid-event.fc-daygrid-event]:m-0 [&_.fc-daygrid-event.fc-daygrid-event]:border-0',
        '[&_.fc-daygrid-event.fc-daygrid-event]:bg-transparent',
        '[&_.fc-daygrid-event.fc-daygrid-event]:p-0',
      ].join(' ')}
    >
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        firstDay={FIRST_DAY}
        headerToolbar={false}
        fixedWeekCount
        showNonCurrentDates
        height="auto"
        dayHeaderContent={(arg) => WEEKDAY_LABELS[(arg.date.getDay() + 6) % 7]}
        eventContent={(arg) => (
          <CompanyLogo companyName={arg.event.title} className="h-7 w-7 rounded-xs" />
        )}
        events={items.map((item) => ({
          id: String(item.id),
          title: item.companyName,
          start: item.recruitmentEndAt.slice(0, 10),
          allDay: true,
        }))}
      />
    </div>
  );
}
