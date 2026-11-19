import { isMockEnabled } from './mocks';

/**
 * 광고 성과 리포트 화면을 보일지(2026-11-19 사용자 결정). 리포트 API(LC-3647)가 배포되기 전에 FE 를 먼저 내보내려고 둔다.
 * 목 모드(`pnpm mock`)에서는 늘 켜지고, 배포본은 `NEXT_PUBLIC_OGONGGO_REPORTS_ENABLED=true` 일 때만 켜진다.
 *
 * 꺼지면 계약 상세의 `계약 전체 성과`·상품 리포트 펼치기, 대시보드의 `진행 중인 광고` 가 빠지고 그 API 를 부르지 않는다.
 * 값은 빌드 시점에 박힌다. 리포트 API 배포 뒤 켜고 다시 빌드한다.
 */
export const isReportEnabled: boolean =
  isMockEnabled || process.env.NEXT_PUBLIC_OGONGGO_REPORTS_ENABLED === 'true';
