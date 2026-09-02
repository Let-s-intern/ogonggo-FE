import { CalendarHeader } from '@/widgets/job-calendar/ui/CalendarHeader';
import { JobCalendarView } from '@/widgets/job-calendar/ui/JobCalendarView';
import type { JobCalendarQuery } from '@/widgets/job-calendar/lib/query';

export type JobCalendarPageProps = JobCalendarQuery;

/**
 * `공고달력.png` — 제목 + 필터 줄, 날짜 이동 줄, 그 아래 격자. 다른 화면들과 같이 페이지
 * 조합은 view 레이어가 맡고 라우트(`app/calendar/page.tsx`)는 쿼리 파싱만 한다(PRD 7절).
 */
export function JobCalendarPage(query: JobCalendarPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-6 px-8">
        <h1 className="text-lg font-bold text-gray-900">공고 달력</h1>
        <CalendarHeader query={query} />
        <JobCalendarView baseDate={query.date} />
      </div>
    </main>
  );
}
