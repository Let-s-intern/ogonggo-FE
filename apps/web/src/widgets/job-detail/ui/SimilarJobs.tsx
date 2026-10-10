import { listPublicJobs, ListPublicJobsSort } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import { toJobInfo } from '@/entities/job/model/analytics';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
import { JobCardLink } from '@/entities/job/ui/JobCardLink';
import type { JobRole, JobSummary } from '@/entities/job/model/types';

export interface SimilarJobsProps {
  excludeJobId: number;
  /** 지금 공고의 직무. 있으면 같은 직무의 공고를 먼저 찾고, 없으면 최신 공고를 보인다. */
  jobRole?: JobRole;
}

const POOL_SIZE = 12;
const SIMILAR_COUNT = 3;

/**
 * "지금 보고 있는 공고와 비슷한 공고에요" 전용 API가 없다(PRD 10절). `GET /api/v1/jobs/similar`
 * 는 로그인 사용자 기준이라 쓰지 않고, 이미 있는 `GET /api/v1/jobs`를 다시 불러
 * (`widgets/popular-jobs/ui/PopularJobs.tsx`와 같은 응답 언랩 방식) 최신 공고를 받는다.
 * `jobRole`을 넘기면 같은 직무로 좁힌다.
 */
async function fetchLatestJobs(size: number, jobRole?: JobRole): Promise<JobSummary[]> {
  const response = (await listPublicJobs({
    size,
    sort: ListPublicJobsSort.LATEST,
    ...(jobRole ? { jobRole: [jobRole] } : {}),
  })) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;

  return response.data?.items ?? [];
}

/**
 * 사이드바의 비슷한 공고 목록. 옆의 `함께 보면 좋아요`(`widgets/cross-sell`)와 같은 틀이다 —
 * 왼쪽에 회사명(회색 줄)과 제목(굵게, 두 줄까지), 오른쪽에 썸네일, 항목 사이에 가는 선.
 * 썸네일은 목록 카드와 같은 `JobThumbnail`(대표 이미지, 없으면 로고)을 폭만 줄여 쓴다.
 *
 * `jobRole`이 있으면 같은 직무의 최신 공고 3개다. 지금 공고도 같은 직무라 목록에 끼므로 4개를
 * 받아 지금 공고를 뺀다. `jobRole`이 없거나 같은 직무의 다른 공고가 하나도 없으면 직무와 상관없이
 * 최신 공고 3개로 돌아간다.
 */
export async function SimilarJobs({ excludeJobId, jobRole }: SimilarJobsProps) {
  const pickOthers = (jobs: JobSummary[]) =>
    jobs.filter((job) => job.id !== excludeJobId).slice(0, SIMILAR_COUNT);

  let items = jobRole ? pickOthers(await fetchLatestJobs(SIMILAR_COUNT + 1, jobRole)) : [];
  if (items.length === 0) {
    items = pickOthers(await fetchLatestJobs(POOL_SIZE));
  }

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
