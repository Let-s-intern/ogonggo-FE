import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { INDUSTRY_REPORTS, findIndustryReport } from '@/shared/config/industryReports';
import { IndustryReportPage } from '@/views/industry-report';

type PageParams = { params: Promise<{ industry: string }> };

/**
 * 상수에 있는 다섯 값만 열린다. `dynamicParams = false` 라 그 밖의 값은 렌더에 들어가기 전에 404 상태로 끝난다 —
 * `(site)/loading.tsx` 가 있어 본문 안의 `notFound()` 만으로는 응답이 이미 200 으로 시작한 뒤다.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return INDUSTRY_REPORTS.map((report) => ({ industry: report.slug }));
}

/**
 * 판매 상세는 실험 기간에 검색엔진에 내지 않는다(PRD 7.1). `noindex` 를 주고 `app/sitemap.ts` 에도 더하지 않는다.
 * 알려진 산업이 아니면 메타데이터는 비우고, 본문 쪽에서 `notFound` 가 404 를 낸다.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { industry } = await params;
  const report = findIndustryReport(industry);
  if (!report) {
    return {};
  }
  return {
    title: `${report.label} 산업 트렌드 리포트`,
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: PageParams) {
  const { industry } = await params;
  const report = findIndustryReport(industry);
  if (!report) {
    notFound();
  }
  return <IndustryReportPage report={report} />;
}
