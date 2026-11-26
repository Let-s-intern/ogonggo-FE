import { ReportLanding } from '@/widgets/report-landing';

/**
 * 산업 트렌드 리포트 통합 랜딩 한 페이지(`/reports`). 산업별 판매 상세(`/reports/[industry]`)로 가는 입구다.
 * 서버에서 그리고 불러오는 값이 없다 — 글은 목데이터다(`widgets/report-landing/model/landingMock.ts`).
 */
export function IndustryReportLandingPage() {
  return <ReportLanding />;
}
