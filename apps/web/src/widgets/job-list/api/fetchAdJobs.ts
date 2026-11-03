import { getPublicJob } from '@ogonggo/api';
import type { SuccessResponseUserJobDetailResponse } from '@ogonggo/api';
import { fetchAdExposures } from '@/entities/advertisement/api/adExposureApi';
import type { AdExposure, AdPlacementKey } from '@/entities/advertisement/model/types';
import type { JobSummary } from '@/entities/job/model/types';

export interface AdJob {
  ad: AdExposure;
  job: JobSummary;
}

/**
 * 공고 카드 모양으로 그리는 구좌(리스트 상단 고정, 적극 채용중, 추천 카드, 비슷한 공고 첫 자리)의 광고와 그 공고.
 * 노출 응답에는 카드에 필요한 칸(썸네일, 고용형태, 마감일 등)이 없어 공고 상세를 한 건씩 읽는다. 상세 응답은 목록
 * 카드가 쓰는 칸을 모두 담는다. 읽지 못한 공고(내려간 공고 등)는 빼고, 광고 API 가 실패하면 빈 목록이다.
 */
export async function fetchAdJobs(
  placementKey: AdPlacementKey,
  jobField?: string,
): Promise<AdJob[]> {
  const ads = (await fetchAdExposures(placementKey, jobField)).filter((ad) => ad.target === 'JOB');
  const jobs = await Promise.all(
    ads.map(async (ad) => {
      try {
        const response = (await getPublicJob(
          ad.postId,
        )) as unknown as SuccessResponseUserJobDetailResponse;
        return response.data ? { ad, job: response.data as JobSummary } : undefined;
      } catch {
        return undefined;
      }
    }),
  );
  return jobs.filter((item): item is AdJob => item !== undefined);
}
