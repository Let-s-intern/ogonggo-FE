import { fetchLetsCareerGuidebook } from '@/shared/api/letsCareerGuidebook';
import { SITE_ORIGIN } from '@/shared/config/site';
import type { IndustryReport } from '@/shared/config/industryReports';
import { IndustryReportSale } from '@/widgets/industry-report-sale';

export interface IndustryReportPageProps {
  report: IndustryReport;
}

/**
 * 산업 트렌드 리포트 판매 상세 한 페이지(`/reports/[industry]`). 산업마다 같은 화면이고 상품(가이드북 id)만
 * 다르다. 상품은 렛츠커리어 공개 API 에서 서버가 읽는다 — 읽지 못해도 화면은 열린다(`fetchLetsCareerGuidebook`).
 */
export async function IndustryReportPage({ report }: IndustryReportPageProps) {
  const guidebook = await fetchLetsCareerGuidebook(report.guidebookId);
  // 사이트 주소는 서버 환경 변수(`OGONGGO_SITE_ORIGIN`)라 브라우저에서는 읽지 못한다. 서버에서 만들어 넘긴다.
  const returnUrl = new URL(`/reports/${report.slug}`, SITE_ORIGIN).toString();
  return (
    // 공고·부트캠프 상세와 같은 바깥틀이다(`px-5`, 안쪽 `max-w-page`).
    <main className="flex min-h-screen flex-col items-center bg-white px-5 pt-4 pb-40 md:pb-10">
      <div className="w-full max-w-page">
        <IndustryReportSale report={report} guidebook={guidebook} returnUrl={returnUrl} />
      </div>
    </main>
  );
}
