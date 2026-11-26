import { LANDING_ISSUE_CODE, LANDING_ISSUE_LABEL } from '../model/landingMock';
import './reportLanding.css';
import { IndustryCardGrid } from './IndustryCardGrid';
import { ReportLandingHero } from './ReportLandingHero';
import { ReportStructure } from './ReportStructure';

/**
 * 산업 트렌드 리포트 통합 랜딩 본문(`/reports`). 히어로, 산업 카드 다섯, 리포트 구성, 마무리 안내 순이다.
 * 글은 모두 목데이터다(`model/landingMock.ts`). 가격은 여기 두지 않는다 — 판매 상세가 렛츠커리어에서 읽어 보인다.
 */
export function ReportLanding() {
  return (
    <main className="overflow-x-clip bg-gray-950 text-gray-100">
      <ReportLandingHero issueLabel={LANDING_ISSUE_LABEL} issueCode={LANDING_ISSUE_CODE} />
      <div className="mx-auto flex w-full max-w-page-padded flex-col gap-24 px-5 py-16 md:gap-32 md:py-24">
        <IndustryCardGrid />
        <ReportStructure />
        <section className="flex flex-col items-start justify-between gap-4 rounded-xl bg-gray-50 px-6 py-6 md:flex-row md:items-center">
          <p className="text-base font-medium break-keep text-gray-800">
            관심 있는 산업부터 가볍게 읽어 보세요. 산업마다 매주 새 리포트가 나와요.
          </p>
          <a
            href="#industries"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-500 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            산업 카드로 돌아가기
            <span aria-hidden="true" className="icon-[lucide--arrow-up] h-4 w-4" />
          </a>
        </section>
      </div>
    </main>
  );
}
