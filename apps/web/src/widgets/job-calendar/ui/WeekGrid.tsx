'use client';

import type { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { cn } from '@ogonggo/ui';
import { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import { toJobInfo } from '@/entities/job/model/analytics';
import { JobCardLink } from '@/entities/job/ui/JobCardLink';
import { ChevronIcon } from '@/shared/ui/icons';
import {
  EVENT_RESET_CLASSES,
  GRID_CLASSES,
  GRID_STYLE,
  useCalendarDate,
  weekdayLabel,
} from '../lib/calendar-grid';
import { filterBookmarkedOnly } from '../lib/bookmarked-only';
import { parseCalendarDate, toCalendarParam, type JobCalendarDateBasis } from '../lib/query';
import { CALENDAR_FIRST_DAY, startOfCalendarWeek } from '../lib/week';
import { useBookmarkedIds } from './BookmarkedOnlyFilterPill';
import { DayHoverPopover, useDayHover } from './DayHoverCard';

/**
 * 주간 뷰의 막대. 공고 하나가 가로 막대 하나이고 `dateBasis`가 가리키는 날(마감일 또는 시작일)
 * 하루에만 놓인다.
 *
 * 처음에는 모집 시작일부터 마감일까지 걸쳤다(PRD 5.2). v6(`docs/asset/v6 공고달력/주간 보기.png`)
 * 는 막대가 한 칸 폭이고 필터 줄에 `마감일 기준`이 켜져 있어 마감일 칸에만 둔다 — 월간과 같은
 * 기준이 됐다(2026-09-21). FullCalendar 의 `end`는 열린 구간이라 그 날 다음 날을 넣는다.
 *
 * 시작일 기준일 때도 막대는 여전히 하루짜리다 — 구간으로 되살리지 않는다
 * (`prd-calendar-date-basis-toggle.md` "결정된 것" 마지막 항목).
 *
 * **`+N`은 주간에 없다**(2026-09-02 결정, PRD 가 정하지 않은 부분이다). 월간의 `+N`은 날짜
 * 칸이 로고 3개씩 두 줄로 크기가 정해진 상자라서 필요한 것인데, 주간의 막대는 아래로 얼마든지
 * 쌓이므로 자를 이유가 없다. 넘치는 주는 아래 `전체 보기`로 접고 편다. 목업
 * (`docs/asset/공고달력 간략히.png`, v6 `주간 보기.png`)에도 `+N`이 없다.
 */
function buildWeekEvents(
  items: UserJobCalendarItemResponse[],
  today: string,
  dateBasis: JobCalendarDateBasis,
): EventInput[] {
  return items.map((item) => {
    const basisDay = (
      dateBasis === 'start' ? item.recruitmentStartAt : item.recruitmentEndAt
    ).slice(0, 10);
    return {
      id: String(item.id),
      title: item.companyName,
      start: basisDay,
      end: exclusiveEnd(basisDay),
      allDay: true,
      // `dueToday` 는 색과 정렬에 같이 쓰인다. `eventOrder` 는 `extendedProps` 를 비교 객체에
      // 평탄하게 펼쳐 주므로(`buildSegCompareObj`, `@fullcalendar/core`) 필드 이름으로 바로
      // 쓸 수 있다. 시작일 기준일 때는 "오늘 시작"이 파랑이 된다(PRD "결정된 것" 2번째 항목).
      extendedProps: { deadline: basisDay, dueToday: basisDay === today ? 1 : 0 },
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

/** 접었을 때 보여 주는 줄 수. */
const COLLAPSED_ROWS = 7;

/** `더 보기` 한 번에 늘리는 줄 수. */
const MORE_ROWS = 30;

/**
 * 날마다 위에서 `rows`개만 남긴다. 막대가 하루짜리라 한 날의 막대는 그 날 칸에만 쌓이므로,
 * 날마다 앞 `rows`개가 곧 격자의 앞 `rows`줄이다.
 *
 * **보이지 않는 막대는 아예 그리지 않는다.** 예전에는 전부 그린 뒤 높이로 잘랐는데, 시작일
 * 기준에서 직무를 여럿 고르면 한 주가 막대 4,902개가 되어(운영, 2026-09-30) FullCalendar 가
 * 그리는 동안 탭이 1분 넘게 멈췄다.
 *
 * 순서는 FullCalendar 의 `eventOrder`와 같아야 한다. 한 날의 막대는 `dueToday`·`start`·
 * `duration`이 모두 같아 결국 `title`(회사명) 순이고, FullCalendar 는 문자열을
 * `localeCompare`로 비교한다(`flexibleCompare`, `@fullcalendar/core`).
 */
function limitRowsPerDay(
  items: UserJobCalendarItemResponse[],
  rows: number,
  dateBasis: JobCalendarDateBasis,
): UserJobCalendarItemResponse[] {
  const byDay = new Map<string, UserJobCalendarItemResponse[]>();
  for (const item of items) {
    const day = (dateBasis === 'start' ? item.recruitmentStartAt : item.recruitmentEndAt).slice(
      0,
      10,
    );
    byDay.set(day, [...(byDay.get(day) ?? []), item]);
  }
  return [...byDay.values()].flatMap((dayItems) =>
    dayItems.sort((a, b) => a.companyName.localeCompare(b.companyName)).slice(0, rows),
  );
}

/**
 * 한 주가 몇 줄이 되는지. 막대가 `dateBasis` 기준 하루짜리라 **한 날에 그 기준이 겹치는 공고
 * 수의 최댓값**이 곧 줄 수다.
 *
 * 렌더된 격자를 재지 않고 데이터로 세는 이유는 FullCalendar 가 막대 높이를 잰 뒤에야 줄
 * 자리를 정하기 때문이다 — 마운트 직후에 재면 아직 배치 전이라 틀린 값이 나온다.
 *
 * 어긋나더라도 화면이 깨지지는 않는다. 적게 세면 `collapsible` 이 꺼져 **자르지 않고 전부
 * 보이고**(컨트롤 없이 잘리는 일이 없다), 많이 세면 컨트롤이 붙되 이미 다 보이는 격자라
 * 눌러도 달라지는 게 없다.
 */
function countWeekRows(
  items: UserJobCalendarItemResponse[],
  weekStart: Date,
  dateBasis: JobCalendarDateBasis,
): number {
  let max = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const day = toCalendarParam(
      new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + offset),
    );
    const covering = items.filter((item) => {
      const basisDay = dateBasis === 'start' ? item.recruitmentStartAt : item.recruitmentEndAt;
      return basisDay.slice(0, 10) === day;
    }).length;
    max = Math.max(max, covering);
  }
  return max;
}

export interface WeekGridProps {
  /** 서버 컴포넌트가 받아 내려준 달력 항목. 여기서 다시 API를 부르지 않는다. */
  items: UserJobCalendarItemResponse[];
  /** 펼칠 주에 든 아무 날짜. `YYYY-MM-DD`. */
  initialDate: string;
  /** `스크랩 공고만` 알약. 서버가 거르지 않은 값이라 여기서 거른다(`../lib/bookmarked-only.ts`). */
  bookmarkedOnly: boolean;
  /** `마감일 기준` 토글 값. 막대를 놓는 날짜 필드와 "오늘" 강조 기준을 정한다. */
  dateBasis: JobCalendarDateBasis;
}

/**
 * 주간 격자(`docs/asset/공고달력 간략히.png`, v6 `docs/asset/v6 공고달력/주간 보기.png`). `간략히 보기`가 켜졌을 때 월간 대신 그려진다
 * (PRD 8.1). 월간과 같은 라이브러리를 감싸지만 렌더 규칙이 전혀 달라 컴포넌트가 갈린다 —
 * 월간은 마감일 칸에 로고와 `+N`, 주간은 마감일 칸의 가로 막대다.
 *
 * 주간은 날짜 칸이 상자가 아니다. 요일·날짜 머리글과 그 아래 가로선 하나가 전부이고, 막대는
 * 칸 폭을 끝까지 채운다. 그래서 월간이 칸에 준 안쪽 여백과 최소 높이를
 * 여기서는 전부 0 으로 되돌린다.
 *
 * 날짜 숫자는 머리글 안에 직접 그린다. `dayGridWeek` 은 줄이 하나뿐이라 FullCalendar 가
 * 칸 안의 날짜 숫자를 아예 렌더하지 않는다(`showDayNumbers: rowCnt > 1`).
 *
 * 스타일을 덮는 방법은 `../lib/calendar-grid`의 `GRID_CLASSES` 주석에 정리했다.
 */
export function WeekGrid({ items, initialDate, bookmarkedOnly, dateBasis }: WeekGridProps) {
  const calendarRef = useRef<FullCalendar>(null);
  useCalendarDate(calendarRef, initialDate);

  const bookmarkedIds = useBookmarkedIds();
  const visibleItems = filterBookmarkedOnly(items, bookmarkedOnly, bookmarkedIds);

  // 막대 색을 가르는 기준(PRD 8.3, "결정된 것" 2번째 항목). 조회 범위가 이 주 7일이라 그려진
  // 막대는 전부 "이번 주 마감"(또는 시작일 기준이면 "이번 주 시작")이고, 그 중 기준일이
  // 오늘인 것만 파랑이다. FullCalendar 의 `arg.isToday` 로는 안 된다 — 그건 막대가 오늘을
  // 지나가는지이지 오늘 끝나는지가 아니다.
  const today = toCalendarParam(new Date());

  // 보이는 줄 수는 지역 상태다. `date`·`brief` 와 달리 공유하거나 새로고침 뒤 되살릴 값이 아니라
  // URL 에 두지 않는다.
  //
  // 주를 옮기면 접힌 채로 시작해야 하는데, 화살표는 같은 라우트 안의 이동이라 이 컴포넌트가
  // 다시 마운트되지 않는다(`useCalendarDate` 가 있는 이유와 같다) — 그냥 두면 펼친 줄 수가
  // 다음 주까지 따라간다. 렌더 중에 되돌리는 것은 React 가 "프로퍼티가 바뀔 때 상태를
  // 맞추는" 방법으로 안내하는 형태다. 이펙트로 미루면 한 프레임 펼쳐진 채 그려졌다가 접힌다.
  const [shownRows, setShownRows] = useState(COLLAPSED_ROWS);
  const [renderedWeek, setRenderedWeek] = useState(initialDate);
  if (renderedWeek !== initialDate) {
    setRenderedWeek(initialDate);
    setShownRows(COLLAPSED_ROWS);
  }

  const weekStart = startOfCalendarWeek(parseCalendarDate(initialDate) ?? new Date());
  const rowCount = countWeekRows(visibleItems, weekStart, dateBasis);
  const drawnItems = limitRowsPerDay(visibleItems, shownRows, dateBasis);
  // 막대마다 `find`로 찾으면 막대 수의 제곱이 된다.
  const itemById = new Map(visibleItems.map((item) => [String(item.id), item]));

  const dayHover = useDayHover();

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
        // **오늘 마감이 맨 위다.** 7줄만 먼저 보여주므로(`limitRowsPerDay`) 가장 급한 공고가
        // 8번째 줄에 있으면 파랑으로 칠한 의미가 없다. 그 다음은 먼저 시작하고 긴 막대 순이고,
        // 줄을 쌓는 일은 FullCalendar 가 한다.
        //
        // **이 값으로 줄 수를 줄일 수는 없다**(2026-09-02 실측). 겹치지 않는 막대를 몇 줄에
        // 담을 수 있는지는 "한 날에 가장 많이 겹치는 막대 수"가 곧 하한이고(구간 그래프라
        // 최대 클릭 = 채색 수), 시작일 순 우선 배치가 그 하한을 그대로 달성하는 고전적인
        // 최적 그리디다. 이번 주 데이터로 네 가지(`start,-duration` / `-duration,start` /
        // `duration,start` / `start`)를 재 보니 막대 40개가 **전부 30줄**이었고, 화요일의
        // 겹침 수 30 과 같았다. 순서를 바꾸면 어느 줄이 붐비는지만 달라진다.
        //
        // 줄이 많아 보이는 것은 목 데이터 밀도 때문이지 배치 때문이 아니다. 막대를 숨겨
        // 줄을 줄이지는 않는다 — `buildWeekEvents` 의 `+N` 판단과 같은 이유다.
        eventOrder="-dueToday,start,-duration,title"
        dayHeaderContent={(arg) => (
          // 머리글은 `MON` 아래 날짜 두 줄이고 오늘은 파란 숫자다(PRD 5.2). 두 줄 사이는
          // 목업 실측 26px 이다.
          <span className="flex flex-col items-center gap-[26px]">
            <span className="text-xs font-medium text-gray-400">{weekdayLabel(arg.date)}</span>
            <span
              className={cn('text-sm font-bold', arg.isToday ? 'text-blue-500' : 'text-gray-900')}
            >
              {arg.date.getDate()}
            </span>
          </span>
        )}
        // 날짜 칸(요일 한 줄)에 마우스를 올리면 그 날짜의 공고 목록이 뜬다(`DayHoverPopover`,
        // PRD 3절). 월간 `MonthGrid`와 같은 방식이다.
        dayCellDidMount={(arg) => dayHover.bindDayCell(arg.el, toCalendarParam(arg.date))}
        eventClassNames={EVENT_BAR_CLASSES}
        eventContent={(arg) => {
          const deadline = arg.event.extendedProps.deadline as string;
          const job = itemById.get(arg.event.id);
          return (
            // 아래 여백이 막대 사이 간격이다. margin 이 아닌 이유는 `EVENT_BAR_CLASSES` 주석에
            // 있다. 라벨은 기업명이고 칸을 넘치면 말줄임이다(PRD 5.2).
            //
            // 누르면 공고 상세로 가고, 달력 안에서는 모달로 뜬다(`app/(site)/calendar/@modal`).
            <JobCardLink
              href={`/jobs/${arg.event.id}`}
              scroll={false}
              className="block pb-2"
              jobId={Number(arg.event.id)}
              jobInfo={job ? toJobInfo(job) : undefined}
              // 막대는 목록이 아니라 격자에 흩어져 있어 순서가 없다.
              tracking={{ listSource: 'calendar', listPosition: null, pageNumber: 1 }}
            >
              <span
                className={cn(
                  // v6 막대는 로고 없이 기업명만 있고 오른쪽 끝에 2px 세로선이 있다.
                  'flex h-9 items-center rounded-[6px] border-r-2 px-3 text-sm text-gray-800',
                  // 목업 실측값 그대로다 — 파랑 막대가 `blue-50`(235,241,255), 회색 막대가
                  // `gray-100`(243,244,246)이고 글자색은 둘 다 `gray-800`(31,41,55)이다.
                  deadline === today ? 'border-blue-100 bg-blue-50' : 'border-gray-200 bg-gray-100',
                )}
              >
                <span className="truncate">{arg.event.title}</span>
              </span>
            </JobCardLink>
          );
        }}
        events={buildWeekEvents(drawnItems, today, dateBasis)}
      />
      <DayHoverPopover hover={dayHover} items={visibleItems} dateBasis={dateBasis} side="right" />
      {rowCount > COLLAPSED_ROWS ? (
        <button
          type="button"
          onClick={() =>
            setShownRows(rowCount > shownRows ? shownRows + MORE_ROWS : COLLAPSED_ROWS)
          }
          className="flex w-full items-center justify-center gap-1 py-3 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          {/*
            한 번에 다 펼치지 않고 `MORE_ROWS`줄씩 늘린다. 막대가 수천 개인 주에 전체를 그리면
            접었을 때와 같은 이유로 탭이 멈춘다(`limitRowsPerDay`).
          */}
          {rowCount > shownRows ? `더 보기 (${drawnItems.length}/${visibleItems.length})` : '접기'}
          <ChevronIcon direction={rowCount > shownRows ? 'down' : 'up'} className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
