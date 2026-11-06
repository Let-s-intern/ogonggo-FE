import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { EventDropArg, EventInput } from '@fullcalendar/core';
import koLocale from '@fullcalendar/core/locales/ko';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import { ActionAlert, Button, Callout, Checkbox, cn } from '@ogonggo/ui';
import {
  useAdCalendar,
  useCalendarTodos,
  usePatchCalendarTodo,
  type CalendarRange,
} from '@/entities/calendar/api/useCalendar';
import { PageHeader } from '@/widgets/page-header';
import {
  CALENDAR_KINDS,
  DONE_COLORS,
  KIND_COLORS,
  KIND_LABELS,
  STACK_ORDER,
  addDays,
  buildAdEvents,
  buildTodoEvents,
  isUndated,
  kstToday,
  toDateString,
  type CalendarEventProps,
  type CalendarKind,
} from '../lib/calendarEvents';
import { TodoFormModal, type TodoEditing } from './TodoFormModal';

type CalendarView = 'month' | 'week';

const FC_VIEWS: Record<CalendarView, string> = { month: 'dayGridMonth', week: 'dayGridWeek' };

/**
 * FullCalendar 가 CSS 변수로 내놓는 색은 변수로 덮는다(웹 `widgets/job-calendar/lib/calendar-grid.ts` 와 같은 방법). 오늘 칸은
 * 옅은 파랑이다.
 */
const GRID_STYLE = {
  '--fc-border-color': 'var(--color-gray-200)',
  '--fc-today-bg-color': 'var(--color-blue-00)',
  '--fc-page-bg-color': 'var(--color-white, #fff)',
} as CSSProperties;

/** 거르기 체크에서 끈 종류. 주소의 `hide`(쉼표로 이음)에 남겨 새로고침·공유해도 같다. */
function readHidden(value: string | null): Set<CalendarKind> {
  const kinds = (value ?? '').split(',');
  return new Set(CALENDAR_KINDS.filter((kind) => kinds.includes(kind)));
}

/**
 * 어드민 캘린더(`/calendar`, 이슈 #573, 2026-11-06 사용자). 헤더 `캘린더` 탭의 화면이다.
 *
 * 사용자 웹 공고 달력과 같은 FullCalendar 6.1.21 을 쓴다. 날짜를 누르거나 끌어 고르는 것(`selectable`)과 할 일 막대를 끌어
 * 옮기고 늘리는 것은 `@fullcalendar/interaction` 이 있어야 해서 그것만 더했다(웹은 날짜 누르기만 있어 넣지 않았다).
 *
 * - 광고 일정(계약·배너·광고 공고)은 막대로 그리고 누르면 그 광고를 고치는 어드민 화면으로 간다(`../lib/calendarEvents.ts`)
 * - 할 일은 날짜를 누르면 하루, 여러 날을 끌면 그 기간으로 추가 모달이 뜬다. 막대를 누르면 수정 모달, 막대 앞 네모를 누르면
 *   바로 완료·완료 취소. 끝낸 할 일은 회색 취소선이다
 * - 오늘은 브라우저 시간대가 아니라 KST 날짜다(`now`). 모든 막대가 날짜만 쓰는 종일 일정이라 시간대가 어긋날 곳은 여기뿐이다
 * - 보기(월간·주간)와 거르기는 주소(`view`, `hide`)에 남는다
 */
export function CalendarPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view: CalendarView = searchParams.get('view') === 'week' ? 'week' : 'month';
  const hidden = readHidden(searchParams.get('hide'));
  const calendarRef = useRef<FullCalendar>(null);
  const [range, setRange] = useState<CalendarRange | null>(null);
  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState<TodoEditing | null>(null);
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);
  const notify = (message: string) => setAlert({ message, nonce: Date.now() });

  const ads = useAdCalendar(range);
  const todos = useCalendarTodos(range);
  const patchTodo = usePatchCalendarTodo();

  const adEvents = useMemo(
    () => (ads.data && range ? buildAdEvents(ads.data, range.to) : []),
    [ads.data, range],
  );
  const todoEvents = useMemo(() => buildTodoEvents(todos.data ?? []), [todos.data]);
  const undatedBanners = ads.data?.banners.filter(isUndated).length ?? 0;
  const undatedAdPostings = ads.data?.adPostings.filter(isUndated).length ?? 0;
  // 범례 옆 수는 이 달력에 그린 막대 수다. 기간 없는 배너·광고 공고는 빼고 아래 안내에 따로 적는다.
  const counts: Record<CalendarKind, number> = {
    contract: ads.data?.contracts.length ?? 0,
    banner: (ads.data?.banners.length ?? 0) - undatedBanners,
    adPosting: (ads.data?.adPostings.length ?? 0) - undatedAdPostings,
    todo: todos.data?.length ?? 0,
  };
  const events: EventInput[] = [...adEvents, ...todoEvents].filter(
    (event) => !hidden.has((event.extendedProps as CalendarEventProps).kind),
  );

  const updateParams = (change: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    change(next);
    setSearchParams(next, { replace: true });
  };
  const toggleKind = (kind: CalendarKind, visible: boolean) =>
    updateParams((params) => {
      const next = new Set(hidden);
      if (visible) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      if (next.size === 0) {
        params.delete('hide');
      } else {
        params.set('hide', CALENDAR_KINDS.filter((item) => next.has(item)).join(','));
      }
    });
  const changeView = (next: CalendarView) => {
    calendarRef.current?.getApi().changeView(FC_VIEWS[next]);
    updateParams((params) => {
      if (next === 'week') {
        params.set('view', 'week');
      } else {
        params.delete('view');
      }
    });
  };
  const api = () => calendarRef.current?.getApi();
  const today = kstToday();

  /** 끌어 옮기거나 늘린 할 일. 끝은 FullCalendar 기준 미포함이라 하루 당긴다. 실패하면 제자리로 되돌린다. */
  const moveTodo = (info: EventDropArg | EventResizeDoneArg) => {
    const props = info.event.extendedProps as CalendarEventProps;
    const startDate = info.event.startStr.slice(0, 10);
    const endExclusive = info.event.endStr ? info.event.endStr.slice(0, 10) : addDays(startDate, 1);
    if (props.todoId === undefined) {
      info.revert();
      return;
    }
    patchTodo.mutate(
      { id: props.todoId, changes: { startDate, endDate: addDays(endExclusive, -1) } },
      {
        onSuccess: () => notify('할 일 날짜를 옮겼습니다.'),
        onError: () => {
          info.revert();
          notify('할 일 날짜를 옮기지 못했습니다.');
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title="캘린더"
        action={
          <Button
            size="sm"
            onClick={() => setEditing({ todo: null, startDate: today, endDate: today })}
          >
            할 일 추가
          </Button>
        }
      />
      <p className="-mt-3 pb-4 text-sm text-gray-500">
        광고 계약·배너·광고 공고 기간과 운영자 할 일을 함께 봅니다. 날짜를 누르거나 여러 날을 끌어
        할 일을 추가합니다.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" aria-label="이전" onClick={() => api()?.prev()}>
            <span aria-hidden="true" className="icon-[lucide--chevron-left] block h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => api()?.today()}>
            오늘
          </Button>
          <Button size="sm" variant="secondary" aria-label="다음" onClick={() => api()?.next()}>
            <span aria-hidden="true" className="icon-[lucide--chevron-right] block h-4 w-4" />
          </Button>
          <h2 className="pl-2 text-lg font-bold text-gray-900" aria-live="polite">
            {title}
          </h2>
        </div>
        <div
          role="group"
          aria-label="보기"
          className="flex rounded-md border border-gray-300 p-0.5"
        >
          {(['month', 'week'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={view === item}
              onClick={() => changeView(item)}
              className={cn(
                'cursor-pointer rounded-sm px-3 py-1 text-sm font-medium',
                view === item ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              {item === 'month' ? '월간' : '주간'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-4" aria-label="일정 종류">
        {CALENDAR_KINDS.map((kind) => (
          <Checkbox
            key={kind}
            checked={!hidden.has(kind)}
            onChange={(checked) => toggleKind(kind, checked)}
            label={
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="block h-3 w-5 rounded-xs"
                  style={{ backgroundColor: KIND_COLORS[kind].background }}
                />
                {KIND_LABELS[kind]}
                <span className="text-gray-400">{counts[kind]}</span>
              </span>
            }
          />
        ))}
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <span
            aria-hidden="true"
            className="block h-3 w-5 rounded-xs border border-gray-300"
            style={{ backgroundColor: DONE_COLORS.background }}
          />
          끝낸 할 일
        </span>
      </div>
      {undatedBanners + undatedAdPostings > 0 ? (
        <p className="-mt-2 pb-4 text-xs text-gray-500">
          기간 없이 켜 둔 배너 {undatedBanners}건, 광고 공고 {undatedAdPostings}건은 날짜가 없어
          달력에 그리지 않습니다. 배너 세팅·광고 공고 세팅에서 봅니다.
        </p>
      ) : null}

      {ads.isError ? (
        <Callout tone="error" className="mb-4">
          광고 일정을 불러오지 못했습니다.
        </Callout>
      ) : null}
      {todos.isError ? (
        <Callout tone="error" className="mb-4">
          할 일을 불러오지 못했습니다.
        </Callout>
      ) : null}

      <div
        style={GRID_STYLE}
        className={cn(
          'rounded-md border border-gray-200 bg-white p-3',
          // 막대 글자. 기본 크기가 커서 한 칸에 두세 개만 들어간다.
          '[&_.fc-daygrid-event]:cursor-pointer [&_.fc-daygrid-event]:text-xs',
          '[&_.fc-col-header-cell-cushion]:py-2 [&_.fc-col-header-cell-cushion]:text-sm',
          '[&_.fc-col-header-cell-cushion]:font-medium [&_.fc-col-header-cell-cushion]:text-gray-500',
          '[&_.fc-daygrid-day-number]:text-sm [&_.fc-daygrid-day-number]:text-gray-700',
          '[&_.fc-day-today_.fc-daygrid-day-number]:font-bold [&_.fc-day-today_.fc-daygrid-day-number]:text-blue-600',
          // 주간 보기는 칸이 낮아 날짜를 끌어 고르기 어렵다. 한 주 줄을 넉넉히 둔다(FullCalendar 가 레이어 밖에서 높이를
          // 잡아 `!` 가 필요하다. 웹 `calendar-grid.ts` 의 `EVENT_RESET_CLASSES` 주석).
          '[&_.fc-dayGridWeek-view_.fc-daygrid-day-frame]:min-h-96!',
          '[&_.fc-highlight]:bg-blue-100!',
        )}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          locale={koLocale}
          initialView={FC_VIEWS[view]}
          headerToolbar={false}
          now={today}
          height="auto"
          fixedWeekCount={false}
          // 월간은 한 칸에 여섯 줄까지 그리고 넘치면 `+N 개` 를 누르면 펼친다. 주간은 칸이 높아 다 그린다.
          dayMaxEvents={6}
          views={{ dayGridWeek: { dayMaxEvents: false } }}
          // 광고 일정은 끌지 않는다. 할 일만 막대마다 `editable` 을 켠다(`buildTodoEvents`).
          editable={false}
          eventResizableFromStart
          selectable
          selectMirror
          // 막대를 끌어 놓은 뒤 이어지는 클릭이 날짜 선택으로 번지지 않게 한다.
          unselectAuto
          // 할 일 → 계약 → 배너 → 광고 공고 순으로 쌓는다(`STACK_ORDER`). 같은 종류는 먼저 시작한 것이 위.
          eventOrder={(a, b) => {
            const kindOf = (event: unknown) =>
              STACK_ORDER.indexOf(
                ((event as { extendedProps: CalendarEventProps }).extendedProps ?? {}).kind,
              );
            return kindOf(a) - kindOf(b);
          }}
          datesSet={(arg) => {
            setTitle(arg.view.title);
            const next = { from: toDateString(arg.start), to: toDateString(arg.end) };
            setRange((current) =>
              current?.from === next.from && current.to === next.to ? current : next,
            );
          }}
          events={events}
          eventClassNames={(arg) => {
            const props = arg.event.extendedProps as CalendarEventProps;
            return props.disabled ? ['opacity-50'] : [];
          }}
          eventContent={(arg) => {
            const props = arg.event.extendedProps as CalendarEventProps;
            return (
              <span title={props.tooltip} className="flex min-w-0 items-center gap-1 px-1 py-0.5">
                {props.kind === 'todo' ? (
                  <span
                    data-todo-toggle=""
                    role="checkbox"
                    aria-checked={props.done === true}
                    aria-label={`${arg.event.title} ${props.done ? '완료 취소' : '완료로 표시'}`}
                    className={cn(
                      'flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border',
                      props.done
                        ? 'border-gray-400 bg-gray-400 text-white'
                        : 'border-amber-700 bg-white',
                    )}
                  >
                    {props.done ? (
                      <span aria-hidden="true" className="icon-[lucide--check] block size-3" />
                    ) : null}
                  </span>
                ) : null}
                <span className={cn('truncate font-medium', props.done ? 'line-through' : '')}>
                  {arg.event.title}
                </span>
              </span>
            );
          }}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            const props = info.event.extendedProps as CalendarEventProps;
            if (props.kind !== 'todo') {
              if (props.href) {
                navigate(props.href);
              }
              return;
            }
            const todo = todos.data?.find((item) => item.id === props.todoId);
            if (!todo) {
              return;
            }
            const target = info.jsEvent.target as HTMLElement | null;
            if (target?.closest('[data-todo-toggle]')) {
              patchTodo.mutate(
                { id: todo.id, changes: { done: !todo.done } },
                {
                  onSuccess: () =>
                    notify(todo.done ? '완료를 취소했습니다.' : '할 일을 끝냈습니다.'),
                },
              );
              return;
            }
            setEditing({ todo });
          }}
          select={(info) => {
            setEditing({
              todo: null,
              startDate: info.startStr.slice(0, 10),
              endDate: addDays(info.endStr.slice(0, 10), -1),
            });
            info.view.calendar.unselect();
          }}
          eventDrop={moveTodo}
          eventResize={moveTodo}
        />
      </div>

      {editing ? (
        <TodoFormModal
          key={editing.todo?.id ?? `new-${editing.startDate}-${editing.endDate}`}
          editing={editing}
          onClose={() => setEditing(null)}
          notify={notify}
        />
      ) : null}
      {alert ? (
        <ActionAlert message={alert.message} nonce={alert.nonce} onDismiss={() => setAlert(null)} />
      ) : null}
    </>
  );
}
