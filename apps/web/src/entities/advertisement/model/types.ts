/**
 * 취준생 화면의 광고 자리가 읽는 노출용 광고(`GET /api/v1/advertisements/exposures`). 백엔드에 아직 없어 생성 타입이
 * 없다. 모양은 목(`packages/api/src/mocks/fixtures/advertisement-types.ts` 의 `AdExposure`)과 같고, 요청서는
 * `.claude/tasks/memos/백엔드-요청-광고-시스템.md` 다. 코드젠 뒤 생성 타입으로 바꾼다.
 */

/** 구좌 키. 목의 `AdPlacementKey` 와 같은 값이다. */
export type AdPlacementKey =
  | 'RECOMMEND_TOP_RECRUIT'
  | 'LIST_TOP_RECRUIT'
  | 'ACTIVE_RECRUIT'
  | 'MAIN_TOP_BANNER_RECRUIT'
  | 'MAIN_BOTTOM_BANNER_RECRUIT'
  | 'SIMILAR_TOP_RECRUIT'
  | 'ACTIVE_EDU'
  | 'MAIN_TOP_BANNER_EDU'
  | 'MAIN_BOTTOM_BANNER_EDU'
  | 'SIMILAR_TOP_EDU'
  | 'CALENDAR_TOP'
  | 'MY_DASHBOARD_SCRAP';

export type AdTargetType = 'JOB' | 'BOOTCAMP';

export interface AdExposure {
  itemId: number;
  placementKey: AdPlacementKey;
  displayOrder: number;
  target: AdTargetType;
  postId: number;
  postTitle: string;
  companyName: string;
  companyLogoUrl?: string;
  jobField?: string;
  /** 해석 한 줄(A1 · A4). */
  headline?: string;
  skillTags: string[];
  bannerImageUrlPc?: string;
  bannerImageUrlMo?: string;
}

/** 광고가 가리키는 상세 주소. */
export function adHref(ad: Pick<AdExposure, 'target' | 'postId'>): string {
  return ad.target === 'BOOTCAMP' ? `/bootcamps/${ad.postId}` : `/jobs/${ad.postId}`;
}
