import { httpClient } from '@ogonggo/api';
import type { UserBootcampSummaryResponse, UserJobSummaryResponse } from '@ogonggo/api';
import { isAdsEnabled } from '@/shared/config/ads';
import type { AdSlot } from './adPosting';

/**
 * 광고 공고 자리(PRD 6.8, D12). 백엔드 `AdvertisementProductPosition` 에 더해지는 값이다. `JOB_PICK` 은 홈 히어로
 * `오공고 PICK` 탭이다(계약 7절).
 */
export type AdPostingPosition = 'JOB_LIST' | 'BOOTCAMP_LIST' | 'JOB_DETAIL_SIDE' | 'JOB_PICK';

/**
 * 광고 공고 한 칸. `targetType` 이 `JOB` 이면 `job`, `BOOTCAMP` 면 `bootcamp` 가 찬다. 응답 모양은
 * `.claude/tasks/memos/광고-리포트-API-계약-2026-11-19.md` 2절이고, 백엔드 배포 뒤 코드젠 타입으로 바꾼다(Push 6 의 11.1).
 */
export interface AdPostingResponse {
  exposureId: number;
  position: AdPostingPosition;
  displayOrder: number;
  targetType: 'JOB' | 'BOOTCAMP';
  /** 카드에 `AD` 표시를 붙일지(계약 7절). */
  adLabel: boolean;
  job: UserJobSummaryResponse | null;
  bootcamp: UserBootcampSummaryResponse | null;
}

/** 자리 하나에 보이는 최대 칸 수(D13). */
export const MAX_AD_POSTINGS = 3;

/** 이 시간 안에 응답이 없으면 광고 없이 그린다. 목록이 광고를 기다리지 않게 한다(`fetchBanners` 와 같다). */
const TIMEOUT_MS = 3000;

/**
 * 자리 하나의 지금 노출 중인 광고 공고(`GET /api/v1/advertisement-exposures/postings?position=`). 서버가 정한 순서
 * 그대로다. 광고를 끈 배포(`shared/config/ads.ts`)에서는 부르지 않고, 실패하면 빈 목록이다 — 광고 때문에 목록이
 * 오류 화면이 되면 안 된다.
 */
export async function fetchAdPostings(position: AdPostingPosition): Promise<AdPostingResponse[]> {
  if (!isAdsEnabled) {
    return [];
  }
  try {
    const response = await httpClient<{ data?: AdPostingResponse[] }>(
      `/api/v1/advertisement-exposures/postings?position=${position}`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    return response.data ?? [];
  } catch (error) {
    console.error(`[ad-postings] ${position} 광고 공고를 받지 못해 자리를 비웁니다.`, error);
    return [];
  }
}

/** 카드에 넘기는 광고 값. 칸 번호는 자리 안 순서(1부터)다. */
export function toAdSlot(posting: AdPostingResponse, position: number): AdSlot {
  return {
    adId: posting.exposureId,
    placement: posting.position,
    position,
    adLabel: posting.adLabel === true,
  };
}
