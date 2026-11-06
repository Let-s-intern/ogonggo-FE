import { isMockEnabled } from './mocks';

/**
 * 배너·광고 공고 자리를 켤지(이슈 #573). 백엔드 배너·광고 API 가 아직 없어 운영에서는 끈다 — 끄면 API 를 부르지 않고
 * 자리도 그리지 않는다(2026-11-06 사용자). 목데이터로 띄우면 늘 켜진다.
 *
 * 백엔드가 배포되면 배포 환경에 `NEXT_PUBLIC_OGONGGO_ADS_ENABLED=true` 를 넣어 켠다. 값은 빌드 시점에 박혀 바꾸면
 * 다시 빌드해야 한다.
 */
export const isAdsEnabled: boolean =
  isMockEnabled || process.env.NEXT_PUBLIC_OGONGGO_ADS_ENABLED === 'true';
