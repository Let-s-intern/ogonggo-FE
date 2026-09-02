'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronIcon } from '@/shared/ui/icons';
import { MiniCalendarPopover } from './MiniCalendarPopover';
import { buildJobCalendarHref, type JobCalendarQuery } from '../lib/query';
import { formatMonthTitle, formatWeekTitle, shiftWeeks } from '../lib/week';

export interface CalendarHeaderProps {
  query: JobCalendarQuery;
}

/**
 * 월간에서 화살표 한 번이 옮기는 만큼. 달 단위이고, 옮긴 달의 1일로 맞춘다 —
 * 날짜를 그대로 들고 옮기면 1월 31일에서 다음 달을 누를 때 `new Date(2026, 1, 31)`이
 * 3월 3일이 되어 2월을 건너뛴다. 월간 뷰는 달만 보므로 며칠인지는 쓰지 않는다.
 *
 * 주간의 이동은 `shiftWeeks`(`../lib/week`)다. 그쪽은 요일을 그대로 들고 7일씩 옮긴다 —
 * 월간과 달리 며칠인지가 곧 보고 있는 주를 정한다.
 */
function shiftMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/**
 * 날짜 이동 줄(`docs/asset/공고달력.png`의 `< 2026.08 >`). 화살표는 버튼이 아니라 URL 을 바꾸는
 * `<Link>` 다 — 상태가 쿼리에 있어서(PRD 7절) 새로고침과 뒤로가기가 그대로 동작한다.
 *
 * `간략히 보기`가 켜지면 제목이 `2026.08 3주차`가 되고 화살표가 주 단위로 움직인다(PRD 5.1).
 * 주차를 세는 규칙은 `../lib/week`의 `formatWeekTitle`에 적었다.
 *
 * 색은 목업에서 그대로 읽었다 — 왼쪽 화살표만 `gray-900`이고 오른쪽은 `gray-300`이다.
 * 둘 다 똑같이 동작한다. 목업의 이 비대칭을 그대로 따른다.
 *
 * 가운데 달력 아이콘이 미니 달력 팝오버를 연다. 팝오버는 고른 날짜를 콜백으로 돌려주므로
 * 이동은 여기서 한다 — 화살표와 달리 `<Link>` 로 미리 그려 둘 수 없는 이동이라 `useRouter` 다.
 * 이것 때문에 이 컴포넌트가 클라이언트 컴포넌트다.
 */
export function CalendarHeader({ query }: CalendarHeaderProps) {
  const router = useRouter();
  const title = query.brief ? formatWeekTitle(query.date) : formatMonthTitle(query.date);
  const step = (delta: number) =>
    query.brief ? shiftWeeks(query.date, delta) : shiftMonths(query.date, delta);
  const unit = query.brief ? '주' : '달';

  return (
    // 화살표 아이콘은 32px 상자 안에 8px 짜리 글리프라 좌우로 12px 씩 비어 있다. 그만큼 당겨야
    // 왼쪽 화살표가 제목 줄(`공고 달력`)과 같은 세로선에서 시작한다(목업 x=161 대 163).
    <div className="-ml-3 flex items-center gap-3">
      <Link
        href={buildJobCalendarHref(query, { date: step(-1) })}
        aria-label={`이전 ${unit}`}
        className="rounded-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <ChevronIcon direction="left" className="h-8 w-8" />
      </Link>
      <span className="text-2xl font-bold text-gray-900">{title}</span>
      <MiniCalendarPopover
        selected={query.date}
        // 고른 날이 든 주로 간다(PRD 8.4). 월간에서는 그 날이 든 달을 펴는 것과 같다.
        onSelect={(date) => router.push(buildJobCalendarHref(query, { date }))}
      />
      <Link
        href={buildJobCalendarHref(query, { date: step(1) })}
        aria-label={`다음 ${unit}`}
        className="rounded-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <ChevronIcon direction="right" className="h-8 w-8" />
      </Link>
    </div>
  );
}
