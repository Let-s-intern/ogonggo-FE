import { listPublicJobs, ListPublicJobsSort } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import { toJobInfo } from '@/entities/job/model/analytics';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
import { JobCardLink } from '@/entities/job/ui/JobCardLink';
import type { JobRole, JobSummary } from '@/entities/job/model/types';
import { adParams, adPostingClickEvent, placeAdsFirst } from '@/shared/ads/adPosting';
import { AdLabel } from '@/shared/ads/AdLabel';
import { fetchAdJobs } from '@/shared/ads/fetchAdPostings';

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
 * 사이드바의 비슷한 공고 목록. 왼쪽에 회사명(회색 줄)과 제목(굵게, 두 줄까지), 오른쪽에 썸네일, 항목 사이에 가는 선.
 * 썸네일은 목록 카드와 같은 `JobThumbnail`(대표 이미지, 없으면 로고)을 폭만 줄여 쓴다.
 *
 * `jobRole`이 있으면 같은 직무의 최신 공고 3개다. 지금 공고도 같은 직무라 목록에 끼므로 4개를
 * 받아 지금 공고를 뺀다. `jobRole`이 없거나 같은 직무의 다른 공고가 하나도 없으면 직무와 상관없이
 * 최신 공고 3개로 돌아간다.
 *
 * 광고 공고(`JOB_DETAIL_SIDE`, 이슈 #573)는 이 목록 맨 앞에 어드민 순서대로 붙는다. 보고 있는 공고의 광고는 빼고, 같은
 * 공고가 비슷한 공고에도 있으면 그쪽에서 뺀다. 비슷한 공고는 광고와 따로 3개를 채운다.
 */
export async function SimilarJobs({ excludeJobId, jobRole }: SimilarJobsProps) {
  const adsPromise = fetchAdJobs('JOB_DETAIL_SIDE');
  const pickOthers = (jobs: JobSummary[], skip: Set<number>) =>
    jobs.filter((job) => job.id !== excludeJobId && !skip.has(job.id)).slice(0, SIMILAR_COUNT);

  const ads = (await adsPromise).filter((ad) => ad.item.id !== excludeJobId);
  const adIds = new Set(ads.map((ad) => ad.item.id));
  let items = jobRole
    ? pickOthers(await fetchLatestJobs(SIMILAR_COUNT + 1 + adIds.size, jobRole), adIds)
    : [];
  if (items.length === 0) {
    items = pickOthers(await fetchLatestJobs(POOL_SIZE), adIds);
  }

  if (items.length === 0 && ads.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">지금 보고 있는 공고와 비슷한 공고에요</h2>
      <ul className="mt-1 divide-y divide-gray-100">
        {placeAdsFirst(ads, items).map(({ item: job, ad }, index) => (
          <li key={ad ? `ad-${ad.adId}` : job.id}>
            <JobCardLink
              href={`/jobs/${job.id}`}
              className="group flex items-center gap-4 py-4"
              jobId={job.id}
              jobInfo={ad ? { ...toJobInfo(job), ...adParams(ad) } : toJobInfo(job)}
              tracking={{ listSource: 'similar', listPosition: index + 1, pageNumber: 1 }}
              extraEvents={ad ? [adPostingClickEvent(ad, 'job', job.id)] : undefined}
            >
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-center gap-1 text-xs text-gray-500">
                  {ad ? <AdLabel /> : null}
                  <span className="truncate">{job.companyName}</span>
                </p>
                <p className="mt-1 line-clamp-2 break-keep text-pretty break-words text-sm font-bold text-gray-800 transition-colors group-hover:text-blue-500">
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
