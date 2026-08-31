import Link from 'next/link';
import { getJobs, GetJobsSort } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import type { JobSummary } from '@/entities/job/model/types';

export interface SimilarJobsProps {
  excludeJobId: number;
}

const POOL_SIZE = 12;
const SIMILAR_COUNT = 3;

/**
 * "지금 보고 있는 공고와 비슷한 공고에요" 전용 API가 없다(PRD 10절) — 이미 있는
 * `GET /api/v1/jobs`를 다시 불러(`widgets/popular-jobs/ui/PopularJobs.tsx`와 같은 응답 언랩
 * 방식) 현재 공고(`excludeJobId`)를 제외한 상위 몇 건을 그대로 쓴다.
 */
async function fetchSimilarPool(): Promise<JobSummary[]> {
  const response = (await getJobs({
    size: POOL_SIZE,
    sort: GetJobsSort.LATEST,
  })) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;

  return response.data?.items ?? [];
}

export async function SimilarJobs({ excludeJobId }: SimilarJobsProps) {
  const pool = await fetchSimilarPool();
  const items = pool.filter((job) => job.id !== excludeJobId).slice(0, SIMILAR_COUNT);

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">지금 보고 있는 공고와 비슷한 공고에요</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((job) => (
          <li key={job.id}>
            <Link href={`/jobs/${job.id}`} className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 rounded-m bg-gray-100" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{job.title}</p>
                <p className="text-xs text-gray-500">{job.companyName}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
