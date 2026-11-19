import { httpClient } from '@ogonggo/api';
import type { UserBootcampSummaryResponse, UserJobSummaryResponse } from '@ogonggo/api';
import type { JobField } from '@/entities/job/model/types';
import { isAdsEnabled } from '@/shared/config/ads';
import type { AdSlot } from './adPosting';

/** Positions supported by the current advertisement product catalog. */
export type AdPostingPosition =
  | 'JOB_LIST'
  | 'JOB_DETAIL_SIDE'
  | 'JOB_PICK'
  | 'CALENDAR_DAY'
  | 'MYPAGE_SCRAP';

/** Current response returned by GET /advertisement-exposures/postings. */
export interface AdPostingResponse {
  exposureId: number;
  position: AdPostingPosition;
  jobField: JobField | null;
  displayOrder: number;
  targetType: 'JOB' | 'BOOTCAMP';
  adLabel: boolean;
  job: UserJobSummaryResponse | null;
  bootcamp: UserBootcampSummaryResponse | null;
}

export const MAX_AD_POSTINGS = 3;
const TIMEOUT_MS = 3000;

/** Return the live, already-hydrated postings for one server-defined position. */
export async function fetchAdPostings(
  position: AdPostingPosition,
  jobField?: JobField,
): Promise<AdPostingResponse[]> {
  if (!isAdsEnabled || (position === 'JOB_LIST') !== Boolean(jobField)) {
    return [];
  }

  const params = new URLSearchParams({ position });
  if (jobField) params.set('jobField', jobField);

  try {
    const response = await httpClient<{ data?: AdPostingResponse[] }>(
      '/api/v1/advertisement-exposures/postings?' + params.toString(),
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    return response.data ?? [];
  } catch (error) {
    console.error('[ad-postings] ' + position + ' 광고 공고를 받지 못해 자리를 비웁니다.', error);
    return [];
  }
}

/** Map the backend exposure metadata to the values passed to an ad card. */
export function toAdSlot(posting: AdPostingResponse): AdSlot {
  return {
    adId: posting.exposureId,
    placement: posting.position,
    position: posting.displayOrder,
    category: 'JOB_POSTING',
    productPosition: posting.position,
    adLabel: posting.adLabel === true,
  };
}
