import { listPublicJobs, ListPublicJobsSort } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import type { JobSummary } from '@/entities/job/model/types';
import { fetchAdJobs } from '@/widgets/job-list';
import { fetchTodayJobs } from '../api/fetchTodayJobs';
import { PopularJobsTabs } from './PopularJobsTabs';

const POOL_SIZE = 100;
const TOP_COUNT = 4;

/**
 * 새 목 엔드포인트를 만들지 않고 이미 있는 `/api/v1/jobs`를 조회수순으로 크게(최대
 * `POOL_SIZE`건) 한 번 받아 세 탭을 클라이언트에서 나눠 쓴다(PRD 10절). `listPublicJobs`의 응답 언랩은
 * `widgets/job-list/ui/JobList.tsx`의 `fetchJobPage`와 같은 방식.
 */
async function fetchPopularPool(): Promise<JobSummary[]> {
  const response = (await listPublicJobs({
    size: POOL_SIZE,
    sort: ListPublicJobsSort.VIEW_COUNT,
  })) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;

  return response.data?.items ?? [];
}

/**
 * 홈 히어로 박스 안의 "오늘의 추천 공고". 탭은 "오공고 PICK"/"인턴 TOP4"/"신입 TOP4" 다.
 *
 * 오공고 PICK 은 운영자가 고른 공고(`fetchTodayJobs`)이고, 0건이거나 받지 못하면 첫 탭이 조회수 상위
 * 네 건인 "인기 공고" 로 바뀐다 — 히어로가 비지 않게 한다(2026-10-12, 사용자). 인턴·신입은 같은
 * 조회수순 묶음에서 나눈다. 두 요청은 서로 기다리지 않는다.
 */
export async function PopularJobs() {
  const [pool, todayPicks, recommendAds] = await Promise.all([
    fetchPopularPool(),
    fetchTodayJobs(),
    fetchAdJobs('RECOMMEND_TOP_RECRUIT'),
  ]);
  // A1 오공고 추천 카드: 첫 탭의 첫 자리. 해석 한 줄(`headline`)이 추천 문구 자리에 들어간다.
  const recommendAd = recommendAds[0];
  const adPick = recommendAd
    ? ({
        ...recommendAd.job,
        recommendationTitle: recommendAd.ad.headline ?? '',
        recommendationDescription: recommendAd.ad.skillTags.join(' · '),
      } as (typeof todayPicks)[number])
    : undefined;
  const picks =
    adPick && todayPicks.length > 0
      ? [adPick, ...todayPicks.filter((job) => job.id !== adPick.id)]
      : todayPicks;
  const popularBase = pool.slice(0, TOP_COUNT);
  const popular =
    recommendAd && todayPicks.length === 0
      ? [recommendAd.job, ...popularBase.filter((job) => job.id !== recommendAd.job.id)].slice(
          0,
          TOP_COUNT,
        )
      : popularBase;
  const intern = pool.filter((job) => job.employmentType === 'INTERN').slice(0, TOP_COUNT);
  const newcomer = pool.filter((job) => job.experienceType === 'NEWCOMER').slice(0, TOP_COUNT);

  return (
    <section className="w-full">
      <PopularJobsTabs
        picks={picks}
        popular={popular}
        intern={intern}
        newcomer={newcomer}
        adJobId={recommendAd?.job.id}
      />
    </section>
  );
}
