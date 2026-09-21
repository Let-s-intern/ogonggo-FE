import { Logo } from '@/shared/ui/Logo';
import { CalendarPanel } from './CalendarPanel';

/**
 * 달력을 불러오는 동안 격자 자리에 들어가는 판(`docs/asset/v6 공고달력/로딩.png`).
 * `JobCalendarPage`의 `Suspense` 폴백이다.
 *
 * 맥동과 300ms 지연 노출은 `LogoLoader`와 같은 전역 클래스(`app/globals.css`)다 — 빨리 끝나는
 * 이동에서 판이 번쩍였다 사라지지 않게 한다. 로고 크기는 목업 실측 170x81 이다.
 */
export function CalendarLoading() {
  return (
    <CalendarPanel className="ogonggo-fallback items-center py-20">
      <div role="status" className="flex flex-col items-center">
        <p className="text-lg text-gray-700">잠시만 기다려주세요</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">공고를 불러오고 있어요</p>
        <Logo className="ogonggo-logo-pulse mt-10 h-[81px] w-[170px] text-blue-400" />
      </div>
    </CalendarPanel>
  );
}
