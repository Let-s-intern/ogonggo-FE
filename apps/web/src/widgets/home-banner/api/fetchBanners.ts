import {
  getListBannersUrl,
  httpClient,
  type BannerPlacement,
  type PublicBannerListResponse,
  type PublicBannerResponse,
} from '@ogonggo/api';

/** 이 시간 안에 응답이 없으면 배너 없이 그린다. 홈 전체가 배너를 기다리지 않게 한다. */
const TIMEOUT_MS = 3000;

/**
 * 자리 하나의 지금 노출 중인 배너들(`GET /api/v1/banners?placement=`, 이슈 #573). 순서는 서버가 정한 그대로다.
 *
 * 백엔드가 아직 없어 손으로 적은 주소·타입(`@ogonggo/api` 의 `banners.ts`)을 쓴다. 배포 뒤 코드젠으로 바꾼다.
 * 실패하면 빈 목록이고 자리는 그리지 않는다 — 배너 하나 때문에 홈이 `(site)/error.tsx` 로 바뀌면 안 된다.
 * 삼킨 오류는 서버 로그에 남긴다(`widgets/popular-jobs/api/fetchTodayJobs.ts` 와 같다).
 */
export async function fetchBanners(placement: BannerPlacement): Promise<PublicBannerResponse[]> {
  try {
    const response = await httpClient<PublicBannerListResponse>(getListBannersUrl(placement), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.data ?? [];
  } catch (error) {
    console.error(`[banners] ${placement} 배너를 받지 못해 자리를 비웁니다.`, error);
    return [];
  }
}
