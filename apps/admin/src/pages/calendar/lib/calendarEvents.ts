import type { EventInput } from '@fullcalendar/core';
import type { AdCalendar, CalendarTodo } from '@/entities/calendar/api/useCalendar';
import { AD_PLACEMENT_LABELS } from '@/entities/ad-posting/lib/adPosting';
import { adContractName } from '@/entities/ad-contract/lib/adContract';
import { PLACEMENT_LABELS } from '@/entities/banner/lib/banner';

/** 달력에 그리는 일정의 종류. 범례·거르기 체크·색이 이 순서다. */
export type CalendarKind = 'contract' | 'banner' | 'adPosting' | 'todo';

export const CALENDAR_KINDS: readonly CalendarKind[] = ['contract', 'banner', 'adPosting', 'todo'];

/**
 * 한 칸 안에서 쌓는 순서. 할 일이 맨 위다 — 운영자가 직접 적은 것이고 광고 막대가 많은 날 `+N` 뒤로 숨으면 놓친다.
 */
export const STACK_ORDER: readonly CalendarKind[] = ['todo', 'contract', 'banner', 'adPosting'];

export const KIND_LABELS: Record<CalendarKind, string> = {
  contract: '계약',
  banner: '배너',
  adPosting: '광고 공고',
  todo: '할 일',
};

/**
 * 종류별 막대 색. FullCalendar 의 `backgroundColor`·`borderColor`·`textColor` 로 넘긴다 — 막대 배경은 FullCalendar 가 레이어 밖
 * CSS 로 잡아 유틸리티로 덮으려면 `!` 가 줄줄이 붙는다(웹 `widgets/job-calendar/lib/calendar-grid.ts`). 값은 디자인 토큰
 * (`blue-100`/`blue-900`)과 Tailwind 기본 팔레트(`violet`, `emerald`, `amber`)의 100·900 단계다. 범례 네모도 같은 값을 쓴다.
 */
export const KIND_COLORS: Record<CalendarKind, { background: string; text: string }> = {
  contract: { background: '#d6e3ff', text: '#1e3366' },
  banner: { background: '#ede9fe', text: '#4c1d95' },
  adPosting: { background: '#d1fae5', text: '#064e3b' },
  todo: { background: '#fef3c7', text: '#78350f' },
};

/** 끝낸 할 일. 회색에 취소선(`CalendarPage` 의 `eventContent`). */
export const DONE_COLORS = { background: '#f3f4f6', text: '#9ca3af' };

/** 막대를 누르면 갈 곳과 할 일 id. `extendedProps` 로 싣는다. */
export interface CalendarEventProps {
  kind: CalendarKind;
  /** 광고 일정이면 누르면 가는 어드민 주소. */
  href?: string;
  /** 할 일이면 그 id. */
  todoId?: number;
  done?: boolean;
  /** 꺼진 배너·광고 공고. 흐리게 그린다. */
  disabled?: boolean;
  /** 막대 위에 올리면 보이는 설명(`title` 속성). */
  tooltip: string;
}

/** `YYYY-MM-DD` 에 하루를 더한다. 시간대와 상관없이 달력 날짜로만 센다. */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

/** 브라우저의 날짜(FullCalendar 가 넘기는 칸 날짜)를 `YYYY-MM-DD` 로. 칸은 로컬 자정이라 로컬 값으로 읽는다. */
export function toDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** 지금의 KST 날짜. 달력의 `오늘` 표시를 브라우저 시간대가 아니라 한국 날짜로 맞춘다. */
export function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * KST 시각 `[startAt, endAt)` 을 종일 막대의 `[start, end)` 날짜로. 끝은 미포함이라 `00:00:00` 이면 그 날짜가 그대로 끝(전날까지
 * 그림)이고, 그 밖이면 그 날도 걸쳐 있어 다음 날이 끝이다. 하루 안에서 끝나도 막대는 하루 칸을 차지한다.
 */
function periodDates(
  startAt: string | null,
  endAt: string | null,
  fallbackStart: string,
  rangeEnd: string,
): { start: string; end: string; openEnd: boolean } {
  const start = (startAt ?? fallbackStart).slice(0, 10);
  let end = rangeEnd;
  if (endAt !== null) {
    const endDate = endAt.slice(0, 10);
    end = endAt.slice(11) === '00:00:00' ? endDate : addDays(endDate, 1);
  }
  return { start, end: end > start ? end : addDays(start, 1), openEnd: endAt === null };
}

function formatPeriodLabel(start: string, endExclusive: string, openEnd: boolean): string {
  const last = addDays(endExclusive, -1);
  const dot = (value: string) => value.replaceAll('-', '.');
  if (openEnd) {
    return `${dot(start)}부터 끝 없음`;
  }
  return start === last ? dot(start) : `${dot(start)} ~ ${dot(last)}`;
}

function colored(kind: CalendarKind, done = false) {
  const colors = done ? DONE_COLORS : KIND_COLORS[kind];
  return {
    backgroundColor: colors.background,
    borderColor: colors.background,
    textColor: colors.text,
  };
}

/**
 * 광고 일정을 막대로.
 *
 * - 계약: `광고주 · 계약명`. 누르면 광고 계약 상세
 * - 배너·광고 공고: `광고주 · 자리`. 누르면 광고주 상세(그 광고주의 배너·광고 공고 표가 있다). 광고주가 없는 배너(오공고 자체
 *   홍보)는 `오공고 · 자리` 이고 누르면 배너 세팅의 그 자리 탭(`?placement=`)
 * - 시작이 없는 배너·광고 공고는 등록일부터, 끝이 없으면 보이는 달력 끝까지 그리고 `끝 없음` 을 붙인다. 꺼진 것은 흐리게
 * - 시작과 끝이 둘 다 없는 배너·광고 공고는 그리지 않는다. 켜 두는 동안 늘 나가는 것이라 날짜가 없고, 그리면 달력의 모든 칸을
 *   같은 막대가 채워 정작 기간이 있는 광고가 `+N` 뒤로 숨는다(시드에서 한 칸에 20개 넘게 쌓였다). 수는 `undatedCount` 로 따로 센다
 */
export function isUndated(item: { startAt: string | null; endAt: string | null }): boolean {
  return item.startAt === null && item.endAt === null;
}

export function buildAdEvents(data: AdCalendar, rangeEnd: string): EventInput[] {
  const events: EventInput[] = [];
  for (const contract of data.contracts) {
    const { start, end, openEnd } = periodDates(contract.startAt, contract.endAt, '', rangeEnd);
    const title = `${contract.advertiser?.name ?? '광고주 없음'} · ${adContractName(contract)}`;
    events.push({
      id: `contract-${contract.id}`,
      title,
      start,
      end,
      allDay: true,
      ...colored('contract'),
      extendedProps: {
        kind: 'contract',
        href: `/business/advertisers/${contract.advertiserId}`,
        tooltip: `광고 계약 · ${title} · ${formatPeriodLabel(start, end, openEnd)}`,
      } satisfies CalendarEventProps,
    });
  }
  for (const banner of data.banners.filter((item) => !isUndated(item))) {
    const { start, end, openEnd } = periodDates(
      banner.startAt,
      banner.endAt,
      banner.createdAt,
      rangeEnd,
    );
    const title = `${banner.advertiser?.name ?? '오공고'} · ${PLACEMENT_LABELS[banner.placement]}`;
    events.push({
      id: `banner-${banner.id}`,
      title: `${title}${openEnd ? ' (끝 없음)' : ''}${banner.enabled ? '' : ' (꺼짐)'}`,
      start,
      end,
      allDay: true,
      ...colored('banner'),
      extendedProps: {
        kind: 'banner',
        href:
          banner.advertiserId === null
            ? `/business/banners?placement=${banner.placement}`
            : `/business/advertisers/${banner.advertiserId}`,
        disabled: !banner.enabled,
        tooltip: `배너 · ${title} · ${banner.name} · ${formatPeriodLabel(start, end, openEnd)}`,
      } satisfies CalendarEventProps,
    });
  }
  for (const ad of data.adPostings.filter((item) => !isUndated(item))) {
    const { start, end, openEnd } = periodDates(ad.startAt, ad.endAt, ad.createdAt, rangeEnd);
    const title = `${ad.advertiser?.name ?? '광고주 없음'} · ${AD_PLACEMENT_LABELS[ad.placement]}`;
    events.push({
      id: `ad-posting-${ad.id}`,
      title: `${title}${openEnd ? ' (끝 없음)' : ''}${ad.enabled ? '' : ' (꺼짐)'}`,
      start,
      end,
      allDay: true,
      ...colored('adPosting'),
      extendedProps: {
        kind: 'adPosting',
        href: `/business/advertisers/${ad.advertiserId}`,
        disabled: !ad.enabled,
        tooltip: `광고 공고 · ${title} · ${ad.targetTitle || '대상 없음'} · ${formatPeriodLabel(start, end, openEnd)}`,
      } satisfies CalendarEventProps,
    });
  }
  return events;
}

/** 할 일을 막대로. 끝나는 날을 포함하므로 FullCalendar 의 끝(미포함)은 그다음 날이다. 할 일만 끌어 옮기고 늘릴 수 있다. */
export function buildTodoEvents(todos: CalendarTodo[]): EventInput[] {
  return todos.map((todo) => ({
    id: `todo-${todo.id}`,
    title: todo.title,
    start: todo.startDate,
    end: addDays(todo.endDate, 1),
    allDay: true,
    editable: true,
    ...colored('todo', todo.done),
    extendedProps: {
      kind: 'todo',
      todoId: todo.id,
      done: todo.done,
      tooltip: `할 일 · ${todo.title}${todo.done ? ' · 완료' : ''} · ${formatPeriodLabel(todo.startDate, addDays(todo.endDate, 1), false)}`,
    } satisfies CalendarEventProps,
  }));
}
