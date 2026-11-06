/**
 * 배너 세팅·광고 공고 세팅 메뉴를 보일지(이슈 #573). 백엔드 배너·광고 API 가 아직 없어 운영에서는 메뉴와 화면을 숨긴다
 * (2026-11-06 사용자). 목데이터로 띄우면 늘 보인다(`app/enableMocking.ts` 와 같은 규칙으로 `false` 일 때만 목이 꺼진다).
 *
 * 백엔드가 배포되면 배포 환경에 `VITE_OGONGGO_ADS_ENABLED=true` 를 넣어 켠다. 값은 빌드 시점에 박힌다.
 */
export const isAdsEnabled: boolean =
  import.meta.env.VITE_OGONGGO_USE_MOCKS !== 'false' ||
  import.meta.env.VITE_OGONGGO_ADS_ENABLED === 'true';
