import { AdSchedule } from '@/widgets/ad-schedule';

/** 신청 가능 일정 화면(시안 B-03). 로그인 없이 본다. */
export function SchedulePage() {
  return (
    <main className="mx-auto w-full max-w-page-padded px-5 py-10 md:py-14">
      <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">신청 가능 일정</h1>
      <p className="pt-2 pb-8 text-sm text-gray-500 md:text-base">
        지면별 잔여 구좌를 주 단위(월~일)로 확인하고 바로 신청해요.
      </p>
      <AdSchedule />
    </main>
  );
}
