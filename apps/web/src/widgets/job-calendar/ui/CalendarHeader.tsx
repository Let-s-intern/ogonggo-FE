import Link from 'next/link';
import { ChevronIcon } from '@/shared/ui/icons';
import { buildJobCalendarHref, type JobCalendarQuery } from '../lib/query';

export interface CalendarHeaderProps {
  query: JobCalendarQuery;
}

/**
 * 화살표 한 번이 옮기는 만큼. 월간이라 달 단위이고, 옮긴 달의 1일로 맞춘다 —
 * 날짜를 그대로 들고 옮기면 1월 31일에서 다음 달을 누를 때 `new Date(2026, 1, 31)`이
 * 3월 3일이 되어 2월을 건너뛴다. 월간 뷰는 달만 보므로 며칠인지는 쓰지 않는다.
 */
function shiftMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/**
 * 날짜 이동 줄(`docs/asset/공고달력.png`의 `< 2026.08 >`). 화살표는 버튼이 아니라 URL 을 바꾸는
 * `<Link>` 다 — 상태가 쿼리에 있어서(PRD 7절) 새로고침과 뒤로가기가 그대로 동작한다.
 *
 * 지금은 월간만 있다. `간략히 보기`가 켜지면 제목이 `2026.08 3주차`가 되고 화살표가 주 단위로
 * 움직이는데(PRD 5.1), 주간 뷰 자체가 Push 3 이라 여기서도 그때 갈라진다.
 *
 * 색은 목업에서 그대로 읽었다 — 왼쪽 화살표만 `gray-900`이고 오른쪽은 `gray-300`이다.
 * 둘 다 똑같이 동작한다. 목업의 이 비대칭을 그대로 따른다.
 */
export function CalendarHeader({ query }: CalendarHeaderProps) {
  const title = `${query.date.getFullYear()}.${String(query.date.getMonth() + 1).padStart(2, '0')}`;

  return (
    // 화살표 아이콘은 32px 상자 안에 8px 짜리 글리프라 좌우로 12px 씩 비어 있다. 그만큼 당겨야
    // 왼쪽 화살표가 제목 줄(`공고 달력`)과 같은 세로선에서 시작한다(목업 x=161 대 163).
    <div className="-ml-3 flex items-center gap-3">
      <Link
        href={buildJobCalendarHref(query, { date: shiftMonths(query.date, -1) })}
        aria-label="이전 달"
        className="rounded-sm text-gray-900 transition-colors hover:bg-gray-100"
      >
        <ChevronIcon direction="left" className="h-8 w-8" />
      </Link>
      <span className="text-2xl font-bold text-gray-900">{title}</span>
      <Link
        href={buildJobCalendarHref(query, { date: shiftMonths(query.date, 1) })}
        aria-label="다음 달"
        className="rounded-sm text-gray-300 transition-colors hover:bg-gray-100"
      >
        <ChevronIcon direction="right" className="h-8 w-8" />
      </Link>
    </div>
  );
}
