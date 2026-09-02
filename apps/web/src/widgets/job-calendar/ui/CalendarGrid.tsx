'use client';

import type { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useEffect, useRef, type CSSProperties } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';

/** 목업의 요일 머리글은 `MON`~`SUN`이다. FullCalendar 기본값은 로케일 약어라 직접 넘긴다. */
const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** 격자의 첫 요일(월요일). `JobCalendarView`의 조회 범위 계산과 같은 값이어야 한다. */
const FIRST_DAY = 1;

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
function buildCalendarEvents(items: UserJobCalendarItemResponse[]): EventInput[] {
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
        extendedProps: { order: index },
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

/**
 * 항목(로고 타일)에서 FullCalendar 기본 껍데기를 벗기는 클래스.
 *
 * `!`(Tailwind v4 의 important 표기, 뒤에 붙는다)가 필요하다. 이 저장소의 유틸리티는
 * `@layer utilities` 안에 있고 FullCalendar 는 CSS 를 레이어 밖에서 런타임에 주입하므로,
 * **명시도를 아무리 올려도 레이어 밖 규칙을 못 이긴다** — `.fc-h-event`의
 * `background-color: var(--fc-event-bg-color); border: 1px solid var(--fc-event-border-color)`
 * (기본값 `#3788d8`)가 그대로 남아 로고마다 파란 액자가 보였다. `!` 선언은 레이어와 무관하게
 * 이긴다.
 */
const EVENT_TILE_CLASSES = ['border-0!', 'bg-transparent!', 'p-0!', 'm-0!'];

/**
 * 항목에 마우스를 올리면 뜨는 문구. **마감일이다** — 기업명도 제목도 아니다(PRD 8.5).
 * 격자가 앞뒤 달을 함께 보여주므로 연도까지 적는다.
 */
function formatDeadlineHint(deadline: Date | null): string | undefined {
  if (!deadline) {
    return undefined;
  }
  const month = String(deadline.getMonth() + 1).padStart(2, '0');
  const day = String(deadline.getDate()).padStart(2, '0');
  return `${deadline.getFullYear()}.${month}.${day} 마감`;
}

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
 *
 * 덮는 방법은 셋이고 상황에 따라 갈린다.
 * 1. FullCalendar 가 CSS 변수로 내놓는 값(테두리 색, 오늘 배경)은 변수로 덮는다.
 * 2. FullCalendar 가 건드리지 않는 속성(글자색, flex 배치)은 그냥 유틸리티로 덮는다.
 * 3. FullCalendar 가 잡는 속성(이벤트 테두리·배경, 격자 세로선, `opacity`)은 `!`를 붙인다 —
 *    유틸리티는 `@layer utilities` 안이라 레이어 밖 규칙에게 명시도와 무관하게 진다.
 */
export function CalendarGrid({ items, initialDate }: CalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // `initialDate` 는 이름 그대로 처음 한 번만 읽힌다. 날짜 이동 줄의 화살표는 같은 라우트 안의
  // 이동이라 React 가 이 컴포넌트를 다시 마운트하지 않고, `events` 는 새 달의 것으로 바뀌는데
  // 격자는 처음 그린 달에 그대로 머문다. 보고 있는 달을 명령형 API 로 따라가게 한다 —
  // `key` 를 걸어 통째로 다시 마운트하는 방법도 있지만 화살표 한 번에 격자 전체를 새로 만든다.
  //
  // 마이크로태스크로 미루는 것은 `gotoDate` 가 안에서 `flushSync` 를 부르기 때문이다. `<Link>`
  // 이동은 트랜지션 안에서 일어나 이 이펙트가 React 가 아직 렌더 중일 때 실행되고, 그대로 부르면
  // 이동 한 번에 `flushSync was called from inside a lifecycle method` 경고가 수백 건 쌓인다.
  useEffect(() => {
    queueMicrotask(() => calendarRef.current?.getApi().gotoDate(initialDate));
  }, [initialDate]);

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
        // 세로 선과 바깥 테두리는 목업에 없다. 가로 선만 남긴다. `!`가 붙은 이유는
        // `EVENT_TILE_CLASSES` 주석과 같다 — FullCalendar 가 같은 속성을 레이어 밖에서 잡는다.
        '[&_.fc-scrollgrid]:border-0!',
        '[&_.fc-theme-standard_td]:border-x-0! [&_.fc-theme-standard_th]:border-x-0!',
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
        '[&_.fc-daygrid-day-frame]:px-1 [&_.fc-daygrid-day-frame]:pb-2',
        '[&_.fc-daygrid-day-events]:flex [&_.fc-daygrid-day-events]:flex-wrap',
        '[&_.fc-daygrid-day-events]:gap-1',
        // FullCalendar 가 이 자리에 걸어 둔 `min-height: 2em`·`margin-bottom: 1em` 을 지운다
        // (레이어 밖 규칙이라 `!` 가 필요하다 — `EVENT_TILE_CLASSES` 주석 참고).
        '[&_.fc-daygrid-day-events]:mb-0! [&_.fc-daygrid-day-events]:min-h-0!',
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
        firstDay={FIRST_DAY}
        headerToolbar={false}
        fixedWeekCount
        showNonCurrentDates
        height="auto"
        // 한 칸 안의 순서는 `buildCalendarEvents`가 매긴 `order` 그대로다(기본값은 제목순).
        eventOrder="order"
        dayHeaderContent={(arg) => WEEKDAY_LABELS[(arg.date.getDay() + 6) % 7]}
        eventClassNames={EVENT_TILE_CLASSES}
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
            <span title={formatDeadlineHint(arg.event.start)}>
              <CompanyLogo companyName={arg.event.title} className="h-7 w-7 rounded-xs" />
            </span>
          );
        }}
        events={buildCalendarEvents(items)}
      />
    </div>
  );
}
