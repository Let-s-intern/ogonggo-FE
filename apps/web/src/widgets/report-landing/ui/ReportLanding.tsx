import { LANDING_ISSUE_LABEL } from '../model/landingMock';
import { IndustryList } from './IndustryList';
import { ReportLandingHero } from './ReportLandingHero';

/**
 * 산업 트렌드 리포트 통합 랜딩 본문(`/reports`). 히어로(파랑 면)와 산업 목록 두 덩이다. 목록의 `리포트 보기`
 * 버튼이 산업별 판매 상세로 보내는 입구라 그 아래에 더 둘 것이 없다. 글은 목데이터(`model/landingMock.ts`)이고
 * 썸네일은 렛츠커리어에서 읽는다. 가격은 여기 두지 않는다 — 판매 상세가 보인다.
 */
export function ReportLanding() {
  return (
    <main>
      <ReportLandingHero issueLabel={LANDING_ISSUE_LABEL} />
      <div className="mx-auto w-full max-w-page-padded px-5 py-12 md:py-16">
        <IndustryList />
      </div>
    </main>
  );
}
