import { JobCardLink } from '@/entities/job/ui/JobCardLink';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
import { adPostingClickEvent } from '@/shared/ads/adPosting';
import { AdLabel } from '@/shared/ads/AdLabel';
import { fetchAdPostings, toAdSlot } from '@/shared/ads/fetchAdPostings';
import { ImpressionTracker } from '@/shared/analytics/ImpressionTracker';

/**
 * 공고 상세 옆 추천 광고 공고(`JOB_DETAIL_SIDE`, PRD 6.8). 모양은 바로 위 `비슷한 공고`(`SimilarJobs`)와 같은 한 줄
 * 카드이고, `adLabel` 이 켜진 칸은 회사명 앞에 `AD` 를 붙인다. 대상은 채용공고뿐이고 지금 보는 공고는 뺀다.
 *
 * 개수 제한 없이 서버 순서대로 전부 쌓는다 — 계약이 늘면 칸도 는다(2026-11-19 사용자). 좁은 화면에서는 사이드바가
 * 본문 아래로 내려가므로 이 묶음도 본문 아래다. 보일 광고가 없으면 아무것도 그리지 않는다.
 *
 * 노출은 칸마다 `IMPRESSION`, 누르면 `ad_posting_click` 과 `AD_CLICK` 이다. 일반 목록 칸이 아니라 `job_card_click`
 * 은 보내지 않는다(`list_source` 허용값에 이 자리가 없다).
 */
export async function SideAdPostings({ excludeJobId }: { excludeJobId: number }) {
  const items = (await fetchAdPostings('JOB_DETAIL_SIDE'))
    .flatMap((posting) =>
      posting.job && posting.job.id !== excludeJobId ? [{ ...posting, job: posting.job }] : [],
    )
    .map((posting, index) => ({ job: posting.job, ad: toAdSlot(posting, index + 1) }));

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">함께 보면 좋은 공고</h2>
      <ul className="mt-1 divide-y divide-gray-100">
        {items.map(({ job, ad }) => (
          <li key={ad.adId}>
            <ImpressionTracker
              contentEvent={{
                type: 'IMPRESSION',
                targetType: 'JOB',
                targetId: job.id,
                exposureId: ad.adId,
                source: 'AD_CARD',
              }}
            >
              <JobCardLink
                href={`/jobs/${job.id}`}
                className="group flex items-center gap-4 py-4"
                jobId={job.id}
                extraEvents={[adPostingClickEvent(ad, 'job', job.id)]}
                adClick={{
                  exposureId: ad.adId,
                  source: 'AD_CARD',
                  target: { targetType: 'JOB', targetId: job.id },
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-center gap-1 text-xs text-gray-500">
                    {ad.adLabel ? <AdLabel /> : null}
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
            </ImpressionTracker>
          </li>
        ))}
      </ul>
    </section>
  );
}
