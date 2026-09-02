'use client';

import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@ogonggo/ui';
import { CalendarIcon, ChevronIcon } from '@/shared/ui/icons';

export interface MiniCalendarPopoverProps {
  /** 지금 달력이 보고 있는 날짜. 미니 달력이 이 달을 펴고 이 날에 표시를 준다. */
  selected: Date;
  /** 날짜를 고르면 그 날이 든 주로 이동한다. 팝오버는 스스로 닫힌다. */
  onSelect: (date: Date) => void;
}

const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/**
 * 날짜 이동 줄의 달력 아이콘을 누르면 열리는 미니 달력
 * (`docs/asset/공고달력 미니달력 모달.png`).
 *
 * 달력 본체(FullCalendar)와 다른 라이브러리를 쓴다. 이벤트가 없는 순수 날짜 선택기에
 * 이벤트 배치 엔진을 얹을 이유가 없고, 인스턴스를 둘로 만들 이유도 없다.
 * 열림·닫힘·바깥 클릭·`Esc`·포커스 되돌리기는 Radix Popover 가 한다.
 *
 * `react-day-picker` 의 기본 CSS 를 가져오지 않고 `classNames` 로 전부 갈아끼운다 —
 * 저장소의 토큰(파랑 스케일, `rounded-*`)만 쓴다. 헤더 줄(`< 2026.08 >` + `오늘`)은
 * 목업 배치가 기본값과 달라 라이브러리 것을 숨기고 직접 그린다.
 */
export function MiniCalendarPopover({ selected, onSelect }: MiniCalendarPopoverProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(selected);

  const shiftMonth = (delta: number) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const handleSelect = (date: Date) => {
    onSelect(date);
    setOpen(false);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // 다시 열 때는 항상 지금 보고 있는 달부터 시작한다.
        if (next) {
          setMonth(selected);
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="날짜 선택"
          className="rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-500 data-[state=open]:text-blue-500"
        >
          <CalendarIcon className="h-5 w-5" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 rounded-lg bg-white p-5 shadow-lg ring-1 ring-gray-200"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="이전 달"
              onClick={() => shiftMonth(-1)}
              className="rounded-sm p-1 text-gray-900 transition-colors hover:bg-gray-100"
            >
              <ChevronIcon direction="left" className="h-4 w-4" />
            </button>
            <span className="text-base font-bold text-gray-900">
              {month.getFullYear()}.{String(month.getMonth() + 1).padStart(2, '0')}
            </span>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => shiftMonth(1)}
              className="rounded-sm p-1 text-gray-900 transition-colors hover:bg-gray-100"
            >
              <ChevronIcon direction="right" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSelect(new Date())}
              className="ml-auto rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100"
            >
              오늘
            </button>
          </div>
          <DayPicker
            mode="single"
            weekStartsOn={1}
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={(date) => date && handleSelect(date)}
            showOutsideDays
            formatters={{
              // 목업은 `MON`~`SUN`이다. 기본값은 로케일 약어라 직접 넘긴다.
              formatWeekdayName: (date) => WEEKDAY_LABELS[(date.getDay() + 6) % 7] ?? '',
            }}
            classNames={miniCalendarClassNames}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** 기본 스타일을 쓰지 않고 목업(`공고달력 미니달력 모달.png`)에 맞춰 전부 지정한다. */
const miniCalendarClassNames = {
  root: 'w-[300px]',
  months: 'flex flex-col',
  month: 'flex flex-col',
  // 헤더 줄은 위에서 직접 그린다.
  nav: 'hidden',
  month_caption: 'hidden',
  month_grid: 'mt-3 w-full border-collapse',
  weekdays: 'flex',
  weekday: 'w-[42px] py-2 text-[11px] font-medium text-gray-400',
  week: 'flex',
  day: 'h-[42px] w-[42px] p-0.5 text-center text-sm',
  day_button: cn(
    'h-full w-full rounded-full text-gray-900 transition-colors',
    'hover:bg-blue-50 hover:text-blue-600',
  ),
  // 오늘은 파란 글씨다(목업).
  today: '[&_button]:font-bold [&_button]:text-blue-500',
  selected: '[&_button]:bg-blue-500 [&_button]:font-bold [&_button]:text-white',
  outside: '[&_button]:text-gray-300',
  disabled: '[&_button]:text-gray-200',
} as const;
