'use client';

import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@ogonggo/ui';

/** 달력 판 높이(px). 위로 펼칠지 정할 때 쓴다. */
const PANEL_HEIGHT = 360;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};

function parseYmd(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

const display = (d: Date) =>
  `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())} (${WEEKDAYS[d.getDay()]})`;

export interface DatePickerProps {
  id?: string;
  /** `YYYY-MM-DD`. 비었으면 ''. `input[type=date]` 의 값과 같은 모양이라 폼 값을 그대로 쓴다. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  /** 이 날 앞은 고를 수 없다(`YYYY-MM-DD`). */
  min?: string;
  /** 닫힌 칸에 더할 클래스(높이·폭·모서리). */
  className?: string;
  disabled?: boolean;
}

/**
 * 사이트 디자인의 날짜 고르기. 네이티브 `input[type=date]` 는 달력을 OS·브라우저가 그려 사이트 디자인과
 * 맞지 않아(2026-11-09, 사용자: 날짜 선택도 모두 커스텀으로) 직접 그린다. 닫힌 칸은 `ListboxSelect` 와 같은
 * 테두리·초점 링이고, 고르기 전에는 회색 안내 문구, 고른 뒤에는 날짜를 파랗게 보인다.
 *
 * 키보드: 칸에서 아래 화살표·엔터·스페이스로 열고, 열린 뒤 화살표로 하루·한 주, PageUp·PageDown 으로 한 달,
 * Home·End 로 주의 처음·끝을 옮겨 엔터·스페이스로 고른다. Esc 는 닫고 칸으로 초점을 돌린다. 바깥을 누르면 닫는다.
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = '날짜를 선택해 주세요',
  'aria-label': ariaLabel,
  min,
  className,
  disabled = false,
}: DatePickerProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  /** 키보드 초점이 있는 날. 보이는 달도 이 날의 달이다. */
  const [focused, setFocused] = useState(() => new Date());

  const selected = parseYmd(value);
  const minDate = min ? parseYmd(min) : null;
  const today = new Date();
  const todayYmd = toYmd(today);
  const blocked = (d: Date) => Boolean(minDate && d < minDate);

  const openPanel = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < PANEL_HEIGHT && rect.top > below);
    }
    setFocused(selected ?? (minDate && today < minDate ? minDate : today));
    setOpen(true);
  };

  const close = (refocus = false) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (d: Date) => {
    if (blocked(d)) return;
    onChange(toYmd(d));
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // 열리거나 초점 날이 바뀌면 그 날 버튼으로 초점을 옮긴다.
  useEffect(() => {
    if (!open) return;
    gridRef.current?.querySelector<HTMLElement>(`[data-ymd="${toYmd(focused)}"]`)?.focus();
  }, [open, focused]);

  const first = new Date(focused.getFullYear(), focused.getMonth(), 1);
  const gridStart = addDays(first, -first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  // 마지막 주가 통째로 다음 달이면 그리지 않는다.
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7)).filter(
    (week, w) => w === 0 || week[0]?.getMonth() === focused.getMonth(),
  );
  const canPrev = !minDate || first > new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  const handleTriggerKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open && ['ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openPanel();
    }
  };

  const handleGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const move: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -focused.getDay()),
      End: () => addDays(focused, 6 - focused.getDay()),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
    };
    const next = move[event.key];
    if (next) {
      event.preventDefault();
      const d = next();
      if (!blocked(d)) setFocused(d);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={
          ariaLabel ? `${ariaLabel}${selected ? `, ${display(selected)}` : ''}` : undefined
        }
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={handleTriggerKey}
        className={cn(
          'flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-white pr-3 pl-4 text-left text-base transition-colors',
          'focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100',
          open ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400',
          'disabled:cursor-not-allowed disabled:bg-gray-50',
          className,
        )}
      >
        <span
          className={cn(
            'truncate tabular-nums',
            selected ? 'font-semibold text-blue-500' : 'text-gray-400',
          )}
        >
          {selected ? display(selected) : placeholder}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'icon-[lucide--calendar] block size-[18px] shrink-0',
            open ? 'text-blue-500' : 'text-gray-500',
          )}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={`${ariaLabel ?? '날짜'} 선택`}
          className={cn(
            'absolute left-0 z-30 w-[300px] rounded-lg border border-gray-200 bg-white p-3',
            'shadow-[0_12px_32px_rgba(17,24,39,0.12)]',
            'transition-[opacity,translate] duration-150 starting:opacity-0',
            dropUp
              ? 'bottom-full mb-1.5 starting:translate-y-1'
              : 'top-full mt-1.5 starting:-translate-y-1',
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="이전 달"
              disabled={!canPrev}
              onClick={() => setFocused(addMonths(focused, -1))}
              className="flex size-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            >
              <span aria-hidden="true" className="icon-[lucide--chevron-left] block size-5" />
            </button>
            <p aria-live="polite" className="text-[15px] font-semibold text-gray-900">
              {focused.getFullYear()}년 {focused.getMonth() + 1}월
            </p>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => setFocused(addMonths(focused, 1))}
              className="flex size-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
            >
              <span aria-hidden="true" className="icon-[lucide--chevron-right] block size-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs text-gray-500">
            {WEEKDAYS.map((d, i) => (
              <span
                key={d}
                className={cn('py-1', i === 0 && 'text-red-400', i === 6 && 'text-blue-400')}
              >
                {d}
              </span>
            ))}
          </div>
          <div ref={gridRef} role="grid" onKeyDown={handleGridKey} className="space-y-0.5">
            {weeks.map((week) => (
              <div key={toYmd(week[0] ?? first)} role="row" className="grid grid-cols-7">
                {week.map((d) => {
                  const ymd = toYmd(d);
                  const isSelected = ymd === value;
                  const isFocused = ymd === toYmd(focused);
                  const outside = d.getMonth() !== focused.getMonth();
                  const off = blocked(d);
                  return (
                    <span key={ymd} role="gridcell" aria-selected={isSelected}>
                      <button
                        type="button"
                        data-ymd={ymd}
                        tabIndex={isFocused ? 0 : -1}
                        disabled={off}
                        aria-label={display(d)}
                        aria-current={ymd === todayYmd ? 'date' : undefined}
                        onClick={() => choose(d)}
                        className={cn(
                          'mx-auto flex size-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300',
                          isSelected
                            ? 'bg-blue-500 font-semibold text-white'
                            : off
                              ? 'cursor-not-allowed text-gray-200'
                              : cn(
                                  'hover:bg-blue-50',
                                  outside ? 'text-gray-300' : 'text-gray-800',
                                  ymd === todayYmd &&
                                    'font-semibold text-blue-500 ring-1 ring-blue-200',
                                ),
                        )}
                      >
                        {d.getDate()}
                      </button>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm">
            <button
              type="button"
              onClick={() => {
                onChange('');
                close(true);
              }}
              className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
            >
              지우기
            </button>
            <button
              type="button"
              disabled={blocked(today)}
              onClick={() => choose(today)}
              className="rounded-md px-2 py-1 font-semibold text-blue-500 hover:bg-blue-50 disabled:opacity-30"
            >
              오늘
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
