import { ReportLanding } from '@/widgets/report-landing';

/**
 * 산업 트렌드 리포트 통합 랜딩 한 페이지(`/reports`). 산업별 판매 상세(`/reports/[industry]`)로 가는 입구다.
 * 썸네일과 가격은 위젯이 렛츠커리어 공개 API 에서 읽는다.
 */
export function IndustryReportLandingPage() {
  return <ReportLanding />;
}
