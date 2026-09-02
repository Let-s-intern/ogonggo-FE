import { MiniCalendarPreview } from '@/widgets/job-calendar/ui/MiniCalendarPreview';

/**
 * 공고 달력. 지금은 미니 달력(`react-day-picker`)이 목업대로 나오는지 눈으로 보기 위한
 * 자리다 — 주간·월간 달력 본체는 아직 없다(`.claude/tasks/todo/job-calendar.md`).
 */
export default function CalendarPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-6 px-8">
        <h1 className="text-lg font-bold text-gray-900">공고 달력</h1>
        <MiniCalendarPreview />
      </div>
    </main>
  );
}
