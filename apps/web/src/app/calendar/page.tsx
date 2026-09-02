import { JobCalendarView } from '@/widgets/job-calendar/ui/JobCalendarView';
import { MiniCalendarPreview } from '@/widgets/job-calendar/ui/MiniCalendarPreview';
import {
  parseJobCalendarQuery,
  type JobCalendarSearchParams,
} from '@/widgets/job-calendar/lib/query';

/**
 * 공고 달력. 월간 뷰가 기본이다(PRD 8.1). 필터 줄은 아래 작업, 주간 뷰는 Push 3 이다.
 *
 * 이 Next 버전에서 `searchParams`는 Promise로 온다 — 다른 화면들과 같다. 이걸 받으면서 이
 * 화면도 자동으로 동적 렌더가 되어, Push 1 이 프리렌더 실패를 막으려고 걸어 둔
 * `export const dynamic = 'force-dynamic'` 이 필요 없어졌다.
 *
 * 값 검증은 `parseJobCalendarQuery` 가 한 곳에서 맡는다
 * (`widgets/job-calendar/lib/query.ts`).
 *
 * `MiniCalendarPreview` 는 미니 달력이 목업대로 나오는지 눈으로 보기 위한 임시 자리다.
 * 날짜 이동 줄이 팝오버를 제대로 달면 이 컴포넌트가 그것으로 대체된다.
 */
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<JobCalendarSearchParams>;
}) {
  const query = parseJobCalendarQuery(await searchParams);

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-6 px-8">
        <h1 className="text-lg font-bold text-gray-900">공고 달력</h1>
        <MiniCalendarPreview />
        <JobCalendarView baseDate={query.date} />
      </div>
    </main>
  );
}
