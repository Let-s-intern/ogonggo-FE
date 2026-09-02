'use client';

import type { EventInput } from '@fullcalendar/core';
import { cn } from '@ogonggo/ui';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useEffect, useRef, type CSSProperties } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';

/** 목업의 요일 머리글은 `MON`~`SUN`이다. FullCalendar 기본값은 로케일 약어라 직접 넘긴다. */
const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** 격자의 첫 요일(월요일). `JobCalendarView`의 조회 범위 계산과 같은 값이어야 한다. */
const FIRST_DAY = 1;

/** 그 날짜의 요일 머리글. 월요일이 0번이 되도록 일요일 기준 인덱스를 6칸 민다. */
function weekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[(date.getDay() + 6) % 7] as string;
}

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
 * 주간 막대에서 같은 껍데기를 벗기는 클래스. 타일과 목록이 같은 이유는 `EVENT_TILE_CLASSES`
 * 주석과 같고, 여백까지 0으로 만드는 것은 막대가 칸 끝에서 끝까지 이어져야 하기 때문이다 —
 * FullCalendar 는 막대의 시작·끝 쪽에 2px 씩 여백을 넣는다.
 *
 * 막대 사이 간격은 여기가 아니라 막대 내용의 아래 여백으로 만든다. FullCalendar 는 줄을
 * 쌓을 자리를 harness 의 `getBoundingClientRect().height`로 재는데(`querySegHeights`)
 * margin 은 그 값에 안 들어가서, margin 으로 띄우면 여러 날에 걸친 막대끼리 겹친다.
 */
const EVENT_BAR_CLASSES = ['border-0!', 'bg-transparent!', 'p-0!', 'm-0!', 'rounded-none!'];

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

/**
 * 그릴 뷰. `간략히 보기`가 켜지면 주간이다(PRD 8.1). 둘 다 `daygrid` 플러그인 하나로 되고
 * `timeline`·`resource` 같은 유료 플러그인은 쓰지 않는다(PRD 6.1).
 */
export type CalendarViewType = 'dayGridMonth' | 'dayGridWeek';

/** 두 뷰가 함께 쓰는 격자 스타일. 나머지는 뷰마다 다르다. */
const GRID_CLASSES = [
  'w-full',
  // 세로 선과 바깥 테두리는 목업에 없다. 가로 선만 남긴다. `!`가 붙은 이유는
  // `EVENT_TILE_CLASSES` 주석과 같다 — FullCalendar 가 같은 속성을 레이어 밖에서 잡는다.
  '[&_.fc-scrollgrid]:border-0!',
  '[&_.fc-theme-standard_td]:border-x-0! [&_.fc-theme-standard_th]:border-x-0!',
];

/** 월간 격자(`docs/asset/공고달력.png`)에만 걸리는 스타일. */
const MONTH_CLASSES = [
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
  // `EVENT_TILE_CLASSES` 주석과 같다 — FullCalendar 가 여기에 `min-height: 100%` 를
  // 레이어 밖에서 걸어 둔다. Push 1 의 `min-h-[104px]` 가 아무 효과도 없던 것이 이것이다.
  '[&_.fc-daygrid-day-frame]:min-h-[144px]!',
  '[&_.fc-daygrid-day-events]:flex [&_.fc-daygrid-day-events]:flex-wrap',
  '[&_.fc-daygrid-day-events]:gap-1',
  // FullCalendar 가 이 자리에 걸어 둔 `min-height: 2em`·`margin-bottom: 1em` 을 지우고
  // 날짜 숫자와의 사이를 목업만큼 띄운다
  // (레이어 밖 규칙이라 `!` 가 필요하다 — `EVENT_TILE_CLASSES` 주석 참고).
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
];

/**
 * 주간 격자(`docs/asset/공고달력 간략히.png`)에만 걸리는 스타일.
 *
 * 주간은 날짜 칸이 상자가 아니다 — 요일·날짜 머리글과 그 아래 가로선 하나가 전부이고,
 * 막대는 칸 경계를 무시하고 왼쪽 끝에서 오른쪽 끝까지 이어진다. 그래서 월간이 칸에 준
 * 안쪽 여백과 최소 높이를 여기서는 전부 0으로 되돌린다.
 *
 * 날짜 숫자는 머리글 안에 직접 그린다. `dayGridWeek` 은 줄이 하나뿐이라 FullCalendar 가
 * 칸 안의 날짜 숫자를 아예 렌더하지 않는다(`showDayNumbers: rowCnt > 1`).
 */
const WEEK_CLASSES = [
  // 머리글이 두 줄이라(`MON` 아래 날짜) 아래로 자리를 더 준다. 목업에서 날짜 줄 아래 가로선까지가
  // 22px 이고, 쿠션(`a.fc-col-header-cell-cushion`)이 이미 2px 을 갖고 있어 20px 을 더하면
  // 23px 이 된다. `!` 가 붙은 이유는 `EVENT_TILE_CLASSES` 주석과 같다 — FullCalendar 가 `th` 의
  // 안쪽 여백을 레이어 밖에서 0 으로 잡아 둔다. 위쪽은 건드리지 않는다. 월간과 같은 자리에서
  // `MON` 이 시작해야 뷰를 오갈 때 머리글이 튀지 않는다.
  '[&_.fc-col-header-cell]:pb-5!',
  // 막대가 칸 끝에서 끝까지 가야 한다. 목업의 막대 왼쪽 끝(x=160)이 격자 왼쪽 끝과 같다.
  // `!` 가 붙은 이유는 `EVENT_TILE_CLASSES` 주석과 같다.
  '[&_.fc-daygrid-day-frame]:p-0!',
  // 머리글 아래 가로선과 첫 막대 사이는 목업에서 12px 이다. FullCalendar 기본값은 1px 이고
  // `min-height: 2em`·`margin-bottom: 1em` 이 함께 붙어 있어 셋 다 덮는다.
  '[&_.fc-daygrid-day-events]:mt-3! [&_.fc-daygrid-day-events]:mb-0!',
  '[&_.fc-daygrid-day-events]:min-h-0!',
];

export interface CalendarGridProps {
  /** 서버 컴포넌트가 받아 내려준 달력 항목. 여기서 다시 API를 부르지 않는다. */
  items: UserJobCalendarItemResponse[];
  /** 펼칠 달. `YYYY-MM-DD`. */
  initialDate: string;
  /** 월간(기본)인지 주간인지. `?brief=1`이 정한다. */
  view: CalendarViewType;
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
export function CalendarGrid({ items, initialDate, view }: CalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // `initialDate` 는 이름 그대로 처음 한 번만 읽힌다. 날짜 이동 줄의 화살표는 같은 라우트 안의
  // 이동이라 React 가 이 컴포넌트를 다시 마운트하지 않고, `events` 는 새 달의 것으로 바뀌는데
  // 격자는 처음 그린 달에 그대로 머문다. 보고 있는 달을 명령형 API 로 따라가게 한다 —
  // `key` 를 걸어 통째로 다시 마운트하는 방법도 있지만 화살표 한 번에 격자 전체를 새로 만든다.
  //
  // 마이크로태스크로 미루는 것은 `gotoDate` 가 안에서 `flushSync` 를 부르기 때문이다. `<Link>`
  // 이동은 트랜지션 안에서 일어나 이 이펙트가 React 가 아직 렌더 중일 때 실행되고, 그대로 부르면
  // 이동 한 번에 `flushSync was called from inside a lifecycle method` 경고가 수백 건 쌓인다.
  //
  // `initialView` 도 같은 함정이다. 체크박스를 켜는 것 역시 같은 라우트 안의 이동이라
  // 리마운트가 없어서, 프로퍼티만 바꾸면 격자는 월간에 머문 채 URL 만 `?brief=1` 이 된다.
  useEffect(() => {
    queueMicrotask(() => {
      const api = calendarRef.current?.getApi();
      if (!api) {
        return;
      }
      if (api.view.type !== view) {
        api.changeView(view);
      }
      api.gotoDate(initialDate);
    });
  }, [initialDate, view]);

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
        ...GRID_CLASSES,
        ...(view === 'dayGridWeek' ? WEEK_CLASSES : MONTH_CLASSES),
      ].join(' ')}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin]}
        initialView={view}
        initialDate={initialDate}
        firstDay={FIRST_DAY}
        headerToolbar={false}
        // 달력 전체 옵션이라 주간에도 걸린다 — `dayGridWeek` 에 켜 두면 1주짜리 뷰가 6주로
        // 늘어난다(`@fullcalendar/daygrid` 의 `buildDayTableRenderRange`). 월간에서만 켠다.
        fixedWeekCount={view === 'dayGridMonth'}
        showNonCurrentDates
        height="auto"
        // 월간에서 한 칸 안의 순서는 `buildCalendarEvents`가 매긴 `order` 그대로다(기본값은
        // 제목순). 주간은 `order`가 없으므로 기본에 가깝게, 먼저 시작하고 긴 막대가 위로 오게
        // 둔다 — 줄을 쌓는 일은 FullCalendar 가 한다.
        eventOrder={view === 'dayGridWeek' ? 'start,-duration,title' : 'order'}
        dayHeaderContent={(arg) =>
          view === 'dayGridWeek' ? (
            // 주간 머리글은 `MON` 아래 날짜 두 줄이고 오늘은 파란 숫자다(PRD 5.2).
            <span className="flex flex-col items-center gap-[26px]">
              <span className="text-xs font-medium text-gray-400">{weekdayLabel(arg.date)}</span>
              <span
                className={cn(
                  'text-sm font-bold',
                  arg.isToday ? 'text-blue-500' : 'text-gray-900',
                )}
              >
                {arg.date.getDate()}
              </span>
            </span>
          ) : (
            weekdayLabel(arg.date)
          )
        }
        eventClassNames={view === 'dayGridWeek' ? EVENT_BAR_CLASSES : EVENT_TILE_CLASSES}
        eventContent={(arg) => {
          if (view === 'dayGridWeek') {
            return (
              // 아래 여백이 막대 사이 간격이다. margin 이 아닌 이유는 `EVENT_BAR_CLASSES`
              // 주석에 있다. 라벨은 기업명이고 칸을 넘치면 말줄임이다(PRD 5.2).
              <span className="block pb-2">
                <span className="block h-9 truncate rounded-[6px] bg-gray-100 px-3 text-sm leading-9 text-gray-800">
                  {arg.event.title}
                </span>
              </span>
            );
          }
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
        events={view === 'dayGridWeek' ? buildWeekEvents(items) : buildCalendarEvents(items)}
      />
    </div>
  );
}
