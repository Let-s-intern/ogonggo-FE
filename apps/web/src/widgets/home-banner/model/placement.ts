import type { ListPublicAdvertisementExposuresPosition } from '@ogonggo/api';

/**
 * 웹의 배너 자리. `HOME_TOP` 은 홈 히어로 아래, `HOME_BOTTOM` 은 홈 목록 아래 `FOR BUSINESS` 배너 위,
 * `JOB_DETAIL_SIDE` 는 공고 상세 오른쪽 사이드바(비슷한 공고 아래)다. 부트캠프 쪽도 같은 세 자리를 둔다 —
 * `BOOTCAMP_TOP` 은 부트캠프 목록 위(첫 쪽만), `BOOTCAMP_BOTTOM` 은 목록 아래 `FOR BUSINESS` 배너 위,
 * `BOOTCAMP_DETAIL_SIDE` 는 부트캠프 상세 오른쪽 사이드바다.
 *
 * 이 이름은 `banner_click` 이벤트의 `banner_placement` 로도 나간다. 이벤트 값을 지키려고 BE 노출 자리 이름으로 바꾸지 않고
 * 부를 때 `BANNER_POSITION` 으로 옮긴다.
 */
export type BannerPlacement =
  | 'HOME_TOP'
  | 'HOME_BOTTOM'
  | 'JOB_DETAIL_SIDE'
  | 'BOOTCAMP_TOP'
  | 'BOOTCAMP_BOTTOM'
  | 'BOOTCAMP_DETAIL_SIDE';

/** 웹 자리 → BE 노출 자리(`AdvertisementProductPosition`). */
export const BANNER_POSITION: Record<BannerPlacement, ListPublicAdvertisementExposuresPosition> = {
  HOME_TOP: 'JOB_HOME_TOP_BANNER',
  HOME_BOTTOM: 'JOB_HOME_BOTTOM_BANNER',
  JOB_DETAIL_SIDE: 'JOB_DETAIL_BANNER',
  BOOTCAMP_TOP: 'BOOTCAMP_LIST_TOP_BANNER',
  BOOTCAMP_BOTTOM: 'BOOTCAMP_LIST_BOTTOM_BANNER',
  BOOTCAMP_DETAIL_SIDE: 'BOOTCAMP_DETAIL_BANNER',
};
