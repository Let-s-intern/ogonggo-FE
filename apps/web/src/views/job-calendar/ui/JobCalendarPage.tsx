import { Suspense } from 'react';
import { CalendarFilterBar } from '@/widgets/job-calendar/ui/CalendarFilterBar';
import { CalendarHeader } from '@/widgets/job-calendar/ui/CalendarHeader';
import { CalendarLoading } from '@/widgets/job-calendar/ui/CalendarLoading';
import { JobCalendarView } from '@/widgets/job-calendar/ui/JobCalendarView';
import { buildJobCalendarHref, type JobCalendarQuery } from '@/widgets/job-calendar/lib/query';

export type JobCalendarPageProps = JobCalendarQuery;

/**
 * `공고달력.png` — 제목 + 필터 줄, 날짜 이동 줄, 그 아래 격자. 다른 화면들과 같이 페이지
 * 조합은 view 레이어가 맡고 라우트(`app/calendar/page.tsx`)는 쿼리 파싱만 한다(PRD 7절).
 *
 * v6(`docs/asset/v6 공고달력/`)에서 필터 줄이 두 줄이 되고, 달력을 불러오는 동안 격자 자리에
 * 로딩 판(`로딩.png`)이 뜬다. 날짜 이동 줄은 격자와 같은 열에 놓여야 해서(월간은 오른쪽에
 * 목록이 붙는다) `JobCalendarView` 가 그린다.
 */
export function JobCalendarPage(query: JobCalendarPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-6 px-8">
        {/* 목업에서 제목은 알약 줄과 세로 가운데가 맞고, 체크박스 줄은 그 아래에 있다. */}
        <div className="flex items-start justify-between">
          <h1 className="flex h-9 items-center text-lg font-bold text-gray-900">공고 달력</h1>
          <CalendarFilterBar query={query} />
        </div>
        {/*
          필터 줄 아래와 날짜 이동 줄 사이는 목업에서 47px 이다. 이 열의 기본 간격(24px)에 화살표
          버튼 자체의 위쪽 여백 8px 을 더해도 32px 이라 모자란 만큼 더 준다.

          `key` 가 쿼리마다 달라 날짜·보기·직무를 바꿀 때마다 로딩 판이 다시 뜬다. 없으면 React 가
          이전 격자를 그대로 둔 채 기다려서 누른 것이 먹었는지 알 수 없다. 폴백에도 날짜 이동 줄을
          그려 두어 불러오는 동안 제목이 사라지지 않게 한다.
        */}
        <div className="mt-4">
          <Suspense
            key={buildJobCalendarHref(query)}
            fallback={
              <div className="flex flex-col gap-4">
                <CalendarHeader query={query} />
                <CalendarLoading />
              </div>
            }
          >
            <JobCalendarView query={query} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
