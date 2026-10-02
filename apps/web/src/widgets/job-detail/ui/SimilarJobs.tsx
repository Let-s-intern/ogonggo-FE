import { listPublicJobs, ListPublicJobsSort } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import { toJobInfo } from '@/entities/job/model/analytics';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
import { JobCardLink } from '@/entities/job/ui/JobCardLink';
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
  const response = (await listPublicJobs({
    size: POOL_SIZE,
    sort: ListPublicJobsSort.LATEST,
  })) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;

  return response.data?.items ?? [];
}

/**
 * 사이드바의 비슷한 공고 목록. 옆의 `함께 보면 좋아요`(`widgets/cross-sell`)와 같은 틀이다 —
 * 왼쪽에 회사명(회색 줄)과 제목(굵게, 두 줄까지), 오른쪽에 썸네일, 항목 사이에 가는 선.
 * 썸네일은 목록 카드와 같은 `JobThumbnail`(대표 이미지, 없으면 로고)을 폭만 줄여 쓴다.
 */
export async function SimilarJobs({ excludeJobId }: SimilarJobsProps) {
  const pool = await fetchSimilarPool();
  const items = pool.filter((job) => job.id !== excludeJobId).slice(0, SIMILAR_COUNT);

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">지금 보고 있는 공고와 비슷한 공고에요</h2>
      <ul className="mt-1 divide-y divide-gray-100">
        {items.map((job, index) => (
          <li key={job.id}>
            <JobCardLink
              href={`/jobs/${job.id}`}
              className="group flex items-center gap-4 py-4"
              jobId={job.id}
              jobInfo={toJobInfo(job)}
              tracking={{ listSource: 'similar', listPosition: index + 1, pageNumber: 1 }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-500">{job.companyName}</p>
                <p className="mt-1 line-clamp-2 text-sm font-bold text-gray-800 transition-colors group-hover:text-blue-500">
                  {job.title}
                </p>
              </div>
              <div className="w-24 shrink-0">
                <JobThumbnail
                  companyName={job.companyName}
                  coverImageUrl={job.coverImageUrl}
                  logoUrl={job.logoUrl}
                />
              </div>
            </JobCardLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
