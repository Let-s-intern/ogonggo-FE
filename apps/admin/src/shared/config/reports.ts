/**
 * 광고 성과 리포트 화면을 켤지(6.12, 2026-11-19 사용자 결정). 리포트 API(BE LC-3647: 상품 리포트·CSV·`report-summary`·계약
 * 광고할 공고 `targets`)가 배포되기 전에 FE 를 먼저 내보내려고 둔다.
 *
 * 목 모드(`app/enableMocking.ts` 와 같은 기준)에서는 늘 켜고, 실제 백엔드에서는 `VITE_OGONGGO_REPORTS_ENABLED=true` 일 때만
 * 켠다. 꺼져 있으면 그 API 를 부르는 화면을 그리지 않는다 — 계약 전체 성과 카드, 상품 행의 리포트 모달, 계약 정보의 `광고할 공고`,
 * 광고 공고를 넣을 때의 `광고할 공고로 등록`. BE 배포 뒤 값을 켜고, 자리 잡으면 이 파일과 분기를 지운다.
 */
const isMockMode = import.meta.env.VITE_OGONGGO_USE_MOCKS !== 'false';

export const isReportEnabled: boolean =
  isMockMode || import.meta.env.VITE_OGONGGO_REPORTS_ENABLED === 'true';
