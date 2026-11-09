import {
  listPublicAdvertisementExposures,
  type AdvertisementExposureResponse,
  type SuccessResponsePageResponseAdvertisementExposureResponse,
} from '@ogonggo/api';
import { isAdsEnabled } from '@/shared/config/ads';
import { BANNER_POSITION, type BannerPlacement } from '../model/placement';

/** 이 시간 안에 응답이 없으면 배너 없이 그린다. 홈 전체가 배너를 기다리지 않게 한다. */
const TIMEOUT_MS = 3000;

/** 한 자리에서 받는 배너 수. BE 는 개수를 자르지 않고 쪽으로 나눠 주므로(기본 10) 넉넉히 한 쪽에 받는다. */
const PAGE_SIZE = 20;

/**
 * 자리 하나의 지금 노출 중인 배너들(`GET /api/v1/advertisement-exposures?position=`, BE LC-3583). 순서는 서버가 정한
 * 그대로다(`displayOrder`, `id`).
 *
 * 실패하면 빈 목록이고 자리는 그리지 않는다 — 배너 하나 때문에 홈이 `(site)/error.tsx` 로 바뀌면 안 된다.
 * 삼킨 오류는 서버 로그에 남긴다(`widgets/popular-jobs/api/fetchTodayJobs.ts` 와 같다).
 */
export async function fetchBanners(
  placement: BannerPlacement,
): Promise<AdvertisementExposureResponse[]> {
  // 운영에서 광고를 켜기 전에는 부르지 않는다(`shared/config/ads.ts`).
  if (!isAdsEnabled) {
    return [];
  }
  try {
    const response = (await listPublicAdvertisementExposures(
      { position: BANNER_POSITION[placement], size: PAGE_SIZE },
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    )) as unknown as SuccessResponsePageResponseAdvertisementExposureResponse;
    return response.data?.items ?? [];
  } catch (error) {
    console.error(`[banners] ${placement} 배너를 받지 못해 자리를 비웁니다.`, error);
    return [];
  }
}
