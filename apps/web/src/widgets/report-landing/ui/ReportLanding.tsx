import { LANDING_ISSUE_LABEL } from '../model/landingMock';
import { IndustryPicker } from './IndustryPicker';
import { ReportLandingClosing } from './ReportLandingClosing';
import { ReportLandingHero } from './ReportLandingHero';
import { SampleReport } from './SampleReport';

/**
 * 산업 트렌드 리포트 통합 랜딩 본문(`/reports`). 히어로(파랑 면, 샘플 표지), 산업 고르기(칩 + 패널), 샘플 리포트(옅은
 * 파랑 띠), 마무리 순이다. 글은 모두 목데이터다(`model/landingMock.ts`). 가격은 여기 두지 않는다 — 판매 상세가
 * 렛츠커리어에서 읽어 보인다.
 */
export function ReportLanding() {
  return (
    <main>
      <ReportLandingHero issueLabel={LANDING_ISSUE_LABEL} />
      <div className="mx-auto w-full max-w-page-padded px-5 py-12 md:py-16">
        <IndustryPicker />
      </div>
      <SampleReport />
      <div className="mx-auto w-full max-w-page-padded px-5 py-12 md:py-16">
        <ReportLandingClosing />
      </div>
    </main>
  );
}
