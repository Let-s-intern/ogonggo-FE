import { fetchLetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';
import { commonFinalPrice } from '../lib/price';
import { LANDING_ISSUE_LABEL } from '../model/landingMock';
import { IndustryList } from './IndustryList';
import { ReportLandingHero } from './ReportLandingHero';

/**
 * 산업 트렌드 리포트 통합 랜딩 본문(`/reports`). 히어로(파랑 면)와 산업 카드 목록 두 덩이다. 카드의 `리포트 보기`
 * 버튼이 산업별 판매 상세로 보내는 입구라 그 아래에 더 둘 것이 없다.
 *
 * 글은 목데이터(`model/landingMock.ts`)이고 썸네일과 가격은 렛츠커리어 공개 API 에서 서버가 다섯 건을 함께 읽는다.
 * 읽지 못한 건은 `null` 이라 그 카드의 썸네일 칸과 가격 줄만 비고, 다섯 가격이 같을 때만 히어로가 한 줄로 알린다.
 */
export async function ReportLanding() {
  const guidebooks = await Promise.all(
    INDUSTRY_REPORTS.map((report) => fetchLetsCareerGuidebook(report.guidebookId)),
  );
  const price = commonFinalPrice(guidebooks.map((guidebook) => guidebook?.priceInfo ?? null));
  return (
    <main>
      <ReportLandingHero issueLabel={LANDING_ISSUE_LABEL} price={price} />
      <div className="mx-auto w-full max-w-page-padded px-5 py-10 md:py-6">
        <IndustryList guidebooks={guidebooks} />
      </div>
    </main>
  );
}
