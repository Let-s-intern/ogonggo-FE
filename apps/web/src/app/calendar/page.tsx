import { JobCalendarView } from '@/widgets/job-calendar/ui/JobCalendarView';
import { MiniCalendarPreview } from '@/widgets/job-calendar/ui/MiniCalendarPreview';

/**
 * 공고 달력. 월간 뷰가 기본이다(PRD 8.1). 필터 줄·날짜 이동 줄은 Push 2, 주간 뷰는 Push 3 다.
 *
 * `MiniCalendarPreview` 는 미니 달력이 목업대로 나오는지 눈으로 보기 위한 임시 자리다 —
 * 날짜 이동 줄이 팝오버를 제대로 달면(Push 2) 없어진다.
 */
export default function CalendarPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-6 px-8">
        <h1 className="text-lg font-bold text-gray-900">공고 달력</h1>
        <JobCalendarView />
        <MiniCalendarPreview />
      </div>
    </main>
  );
}
