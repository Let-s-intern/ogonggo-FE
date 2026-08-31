import { getJobs, GetJobsSort } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import type { JobSummary } from '@/entities/job/model/types';
import { PopularJobsTabs } from './PopularJobsTabs';

const POOL_SIZE = 100;
const TOP_COUNT = 4;

/**
 * 새 목 엔드포인트를 만들지 않고 이미 있는 `/api/v1/jobs`를 조회수순으로 크게(최대
 * `POOL_SIZE`건) 한 번 받아 세 탭을 클라이언트에서 나눠 쓴다(PRD 10절). `getJobs`의 응답 언랩은
 * `widgets/job-list/ui/JobList.tsx`의 `fetchJobPage`와 같은 방식.
 */
async function fetchPopularPool(): Promise<JobSummary[]> {
  const response = (await getJobs({
    size: POOL_SIZE,
    sort: GetJobsSort.VIEW_COUNT,
  })) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;

  return response.data?.items ?? [];
}

/** "인기 공고"/"인턴 TOP4"/"신입 TOP4" — 전부 같은 조회수순 데이터에서 파생한다. */
export async function PopularJobs() {
  const pool = await fetchPopularPool();
  const popular = pool.slice(0, TOP_COUNT);
  const intern = pool.filter((job) => job.employmentType === 'INTERN').slice(0, TOP_COUNT);
  const newcomer = pool.filter((job) => job.experienceType === 'NEWCOMER').slice(0, TOP_COUNT);

  return (
    <section className="w-full">
      <PopularJobsTabs popular={popular} intern={intern} newcomer={newcomer} />
    </section>
  );
}
