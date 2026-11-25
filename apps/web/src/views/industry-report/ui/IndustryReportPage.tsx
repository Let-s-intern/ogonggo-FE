import type { IndustryReport } from '@/shared/config/industryReports';

export interface IndustryReportPageProps {
  report: IndustryReport;
}

/**
 * 산업 트렌드 리포트 판매 상세 한 페이지(`/reports/[industry]`). 산업마다 같은 화면이고 상품(가이드북 id)만
 * 다르다.
 */
export function IndustryReportPage({ report }: IndustryReportPageProps) {
  return (
    <main className="mx-auto w-full max-w-page px-5 py-10">
      <h1 className="text-2xl font-bold text-gray-950">{report.label} 산업 트렌드 리포트</h1>
    </main>
  );
}
