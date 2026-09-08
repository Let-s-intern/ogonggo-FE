'use client';

import type { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';
import {
  EVENT_RESET_CLASSES,
  formatDeadlineHint,
  GRID_CLASSES,
  GRID_STYLE,
  useCalendarDate,
  weekdayLabel,
} from '../lib/calendar-grid';
import { withJobParam } from '../lib/query';
import { CALENDAR_FIRST_DAY } from '../lib/week';

/** 한 칸에 그대로 다 그리는 최대 개수. 여기까지는 `+N`이 붙지 않는다(PRD 8.2). */
const MAX_EVENTS_PER_DAY = 8;

/** 위를 넘긴 칸에서 실제로 그리는 로고 수. 남은 한 자리(8번째)를 `+N`이 차지한다. */
const EVENTS_BESIDE_MORE = 7;

/**
 * 날짜별로 묶어 그 칸에 넣을 이벤트를 만든다.
 *
 * `+N`을 FullCalendar 의 `dayMaxEvents`에 맡기지 않는 이유가 있다. 그 옵션은 숫자를 주면
 * `maxStackCnt`가 되고 `hiddenConsumes`가 `false`라 링크가 자리를 차지하지 않는다
 * (`@fullcalendar/daygrid` 의 `internal.js`) — 즉 "항상 N개를 그리고 넘치면 링크를 더 붙인다"
 * 뿐이라 **8개인 칸만 예외로 다 보여주는** 이 규칙을 표현할 수 없다. `dayMaxEvents={7}`로 두면
 * 8개인 칸이 `7개 + +1`이 되어 버린다. 그래서 자르는 일을 여기서 한다.
 *
 * `+N`도 이벤트 하나로 넣는다. 그래야 로고와 같은 자리 폭(1/4)을 받아 목업처럼 마지막
 * 8번째 칸에 앉는다. 순서는 `order`로 못 박는다 — FullCalendar 의 기본 정렬은 제목순이라
 * `+5` 같은 문자열이 로고들 사이로 끼어든다.
 */
function buildMonthEvents(
  items: UserJobCalendarItemResponse[],
  calendarHref: string,
): EventInput[] {
  const byDay = new Map<string, UserJobCalendarItemResponse[]>();
  for (const item of items) {
    const day = item.recruitmentEndAt.slice(0, 10);
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
        // `url` 을 주면 FullCalendar 가 타일을 진짜 `href` 가 있는 `<a>` 로 그린다 — 키보드
        // 포커스와 `cmd+클릭`(새 탭)이 그대로 되고 스크린 리더도 링크로 읽는다. 실제 이동은
        // `eventClick` 이 가로채 라우터로 처리한다(전체 새로고침을 막는다).
        url: withJobParam(calendarHref, item.id),
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
  /** 지금 달력 주소(`?date=`·`?brief=` 포함). 타일 링크는 여기에 `job=<id>` 만 붙인다. */
  calendarHref: string;
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
 * 생김새가 달라 `CalendarHeader`가 따로 그린다.
 *
 * 스타일을 덮는 방법은 `../lib/calendar-grid`의 `GRID_CLASSES` 주석에 정리했다.
 */
export function MonthGrid({ items, initialDate, calendarHref }: MonthGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const router = useRouter();
  useCalendarDate(calendarRef, initialDate);

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
        // 한 줄에 4개까지다(PRD 5.3). 칸 너비에 기대지 않고 자리 폭을 1/4로 못 박는다 —
        // 가로 여백 4px 세 칸(12px)에 반올림 여유 4px 을 더 뺀다. 딱 맞게 잡으면 소수점
        // 반올림에서 한 개가 다음 줄로 밀린다.
        '[&_.fc-daygrid-event-harness]:basis-[calc(25%-4px)]',
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
        eventClassNames={EVENT_RESET_CLASSES}
        // 타일을 누르면 상세 모달이 열린다(PRD 8.6). `url` 을 그대로 따라가게 두면 전체
        // 새로고침이라 여기서 막고 라우터로 옮긴다 — 그래야 뒤에 있는 달력이 그대로 남고
        // 모달만 새로 뜬다. `+N` 은 `url` 이 없어 아무 일도 하지 않는다(어떤 공고를 열지
        // 정해지지 않았다, PRD 범위 밖).
        eventClick={(arg) => {
          arg.jsEvent.preventDefault();
          if (arg.event.url) {
            router.push(arg.event.url);
          }
        }}
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
          return (
            <span title={formatDeadlineHint(arg.event.extendedProps.deadline as string)}>
              {/*
                `CompanyLogo` 의 기본 안쪽 여백(`p-1`)을 여기서만 없앤다. 28px 타일에서 4px 씩
                빼면 그림이 들어갈 자리가 20px 밖에 남지 않아 로고가 상자 안에서 너무 작아
                보였다(상자 넓이 대비 그림 넓이 평균 29.9%). `object-contain` 은 그대로 둔다 —
                `object-cover` 로 채우면 마크가 치우친 로고에서 글자가 잘린다
                (`entities/job/ui/CompanyLogo.tsx` 주석).
              */}
              <CompanyLogo companyName={arg.event.title} className="h-7 w-7 rounded-xs p-0" />
            </span>
          );
        }}
        events={buildMonthEvents(items, calendarHref)}
      />
    </div>
  );
}
