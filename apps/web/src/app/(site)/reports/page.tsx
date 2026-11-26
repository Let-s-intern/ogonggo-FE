import type { Metadata } from 'next';
import { IndustryReportLandingPage } from '@/views/industry-report-landing';

/**
 * 판매 상세와 같이 실험 기간에는 검색엔진에 내지 않는다(PRD 7.1). `app/sitemap.ts` 에도 더하지 않는다.
 * 기능 플래그와 상관없이 주소로 열린다 — 플래그는 오공고 안 진입점(헤더 메뉴)의 노출만 정한다.
 */
export const metadata: Metadata = {
  title: '산업 트렌드 리포트',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <IndustryReportLandingPage />;
}
