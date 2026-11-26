import { LANDING_ISSUE_LABEL } from '../model/landingMock';
import { IndustryCardGrid } from './IndustryCardGrid';
import { ReportLandingClosing } from './ReportLandingClosing';
import { ReportLandingHero } from './ReportLandingHero';
import { ReportStructure } from './ReportStructure';

/**
 * 산업 트렌드 리포트 통합 랜딩 본문(`/reports`). 파랑 히어로, 산업 카드 다섯, 리포트 구성(옅은 파랑 띠), 마무리
 * 순이다. 글은 모두 목데이터다(`model/landingMock.ts`). 가격은 여기 두지 않는다 — 판매 상세가 렛츠커리어에서 읽어
 * 보인다.
 */
export function ReportLanding() {
  return (
    <main>
      <ReportLandingHero issueLabel={LANDING_ISSUE_LABEL} />
      <div className="mx-auto w-full max-w-page-padded px-5 py-16 md:py-24">
        <IndustryCardGrid />
      </div>
      <ReportStructure />
      <div className="mx-auto w-full max-w-page-padded px-5 py-16 md:py-24">
        <ReportLandingClosing />
      </div>
    </main>
  );
}
