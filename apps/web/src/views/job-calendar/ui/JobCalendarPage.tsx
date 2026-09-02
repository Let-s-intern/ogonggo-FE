import { CalendarFilterBar } from '@/widgets/job-calendar/ui/CalendarFilterBar';
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
        {/* 목업에서 제목과 필터 줄은 같은 줄이고 세로 가운데가 맞는다. */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">공고 달력</h1>
          <CalendarFilterBar query={query} />
        </div>
        {/*
          목업에서 필터 줄 아래와 날짜 이동 줄 사이는 47px 인데, 이 열의 기본 간격(24px)에
          화살표 버튼 자체의 위쪽 여백 8px 을 더해도 32px 밖에 안 된다. 모자란 만큼만 더 준다.
        */}
        <div className="mt-4">
          <CalendarHeader query={query} />
        </div>
        <JobCalendarView baseDate={query.date} brief={query.brief} />
      </div>
    </main>
  );
}
