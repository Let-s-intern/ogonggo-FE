import {
  getListAdPostingsUrl,
  httpClient,
  type AdPostingPlacement,
  type PublicAdPostingListResponse,
  type UserBootcampSummaryResponse,
  type UserJobSummaryResponse,
} from '@ogonggo/api';
import type { AdItem } from './adPosting';
import { isAdsEnabled } from '@/shared/config/ads';

/** 이 시간 안에 응답이 없으면 광고 없이 그린다. 목록이 광고를 기다리지 않게 한다. */
const TIMEOUT_MS = 3000;

/**
 * 자리 하나의 지금 노출 중인 광고 공고(`GET /api/v1/ad-postings?placement=`, 이슈 #573). 순서는 서버가 정한 그대로다.
 *
 * 백엔드가 아직 없어 손으로 적은 주소·타입(`@ogonggo/api` 의 `ad-postings.ts`)을 쓴다. 배포 뒤 코드젠으로 바꾼다.
 * 실패하면 빈 목록이고 광고 없이 일반 목록만 그린다 — 광고 하나 때문에 목록이 오류 화면으로 바뀌면 안 된다.
 * 삼킨 오류는 로그에 남긴다(`widgets/home-banner/api/fetchBanners.ts` 와 같다).
 *
 * 서버 컴포넌트와 브라우저(마이페이지 보드) 모두 부른다.
 */
async function fetchAdPostings(placement: AdPostingPlacement) {
  // 운영에서 광고를 켜기 전에는 없는 API 를 부르지 않는다(`shared/config/ads.ts`).
  if (!isAdsEnabled) {
    return [];
  }
  try {
    const response = await httpClient<PublicAdPostingListResponse>(
      getListAdPostingsUrl(placement),
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    return response.data ?? [];
  } catch (error) {
    console.error(`[ad-postings] ${placement} 광고를 받지 못해 일반 목록만 보입니다.`, error);
    return [];
  }
}

/** 채용공고 자리의 광고. 카드 내용(`job`)이 빠진 항목은 버린다. 칸 번호는 남은 것의 순서다. */
export async function fetchAdJobs(
  placement: Exclude<AdPostingPlacement, 'BOOTCAMP_LIST'>,
): Promise<AdItem<UserJobSummaryResponse>[]> {
  const ads = await fetchAdPostings(placement);
  return ads
    .flatMap((ad) => (ad.job ? [{ adId: ad.id, item: ad.job }] : []))
    .map(({ adId, item }, index) => ({ slot: { adId, placement, position: index + 1 }, item }));
}

/** 부트캠프 목록 자리의 광고. */
export async function fetchAdBootcamps(): Promise<AdItem<UserBootcampSummaryResponse>[]> {
  const ads = await fetchAdPostings('BOOTCAMP_LIST');
  return ads
    .flatMap((ad) => (ad.bootcamp ? [{ adId: ad.id, item: ad.bootcamp }] : []))
    .map(({ adId, item }, index) => ({
      slot: { adId, placement: 'BOOTCAMP_LIST', position: index + 1 },
      item,
    }));
}
