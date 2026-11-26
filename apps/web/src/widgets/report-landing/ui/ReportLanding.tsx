import { fetchLetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';
import { commonFinalPrice } from '../lib/price';
import { ReportLandingHero } from './ReportLandingHero';

/**
 * 산업 트렌드 리포트 통합 랜딩 본문(`/reports`). 화면 전체를 채우는 히어로 하나이고, 히어로 안의 산업 패널 다섯이
 * 산업별 판매 상세로 보내는 입구라 그 아래에 더 둘 것이 없다.
 *
 * 화면의 글은 제목·산업 이름(상수)뿐이고 썸네일과 가격은 렛츠커리어 공개 API 에서 서버가 다섯 건을 함께 읽는다.
 * 읽지 못한 건은 `null` 이라 그 패널의 썸네일과 가격 알약만 빠지고, 다섯 가격이 같을 때만 제목 옆 가격 칩을 보인다.
 */
export async function ReportLanding() {
  const guidebooks = await Promise.all(
    INDUSTRY_REPORTS.map((report) => fetchLetsCareerGuidebook(report.guidebookId)),
  );
  const price = commonFinalPrice(guidebooks.map((guidebook) => guidebook?.priceInfo ?? null));
  return (
    <main>
      <ReportLandingHero price={price} guidebooks={guidebooks} />
    </main>
  );
}
