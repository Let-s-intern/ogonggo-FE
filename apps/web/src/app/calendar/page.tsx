import { JobCalendarView } from '@/widgets/job-calendar/ui/JobCalendarView';
import { MiniCalendarPreview } from '@/widgets/job-calendar/ui/MiniCalendarPreview';

/**
 * 이 화면은 빌드 시점에 미리 그릴 수 없다. 기준 날짜가 "오늘"이라 빌드한 날의 달이 그대로
 * 굳고, 달력 데이터도 요청 때 받아야 한다 — 다른 화면들은 `searchParams` 를 받아 자동으로
 * 동적이 되지만 이 화면은 아직 쿼리를 안 받아 정적 프리렌더 대상이 된다(Push 2 가 `?date=` 를
 * 붙이면 그때는 자동이다). 명시하지 않으면 `next build` 가 프리렌더를 시도하다 실패한다.
 *
 * `dynamic` 은 Cache Components 를 켜지 않은 이 저장소에서 유효한 설정이다
 * (node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md 의
 * `dynamic` 절 — `'force-dynamic'` 은 요청마다 렌더한다).
 */
export const dynamic = 'force-dynamic';

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
