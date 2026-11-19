import { JobCardLink } from '@/entities/job/ui/JobCardLink';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
import { adPostingClickEvent, type AdSlot } from '@/shared/ads/adPosting';
import { AdLabel } from '@/shared/ads/AdLabel';
import { fetchAdPostings, MAX_AD_POSTINGS, toAdSlot } from '@/shared/ads/fetchAdPostings';
import { ImpressionTracker } from '@/shared/analytics/ImpressionTracker';
import { TrackedLink } from '@/shared/analytics/TrackedLink';

interface SideItem {
  ad: AdSlot;
  kind: 'job' | 'bootcamp';
  id: number;
  summary: { companyName: string; title: string; logoUrl?: string };
  coverImageUrl?: string;
}

/**
 * 공고 상세 옆 추천 광고 공고(`JOB_DETAIL_SIDE`, PRD 6.8). 모양은 바로 위 `비슷한 공고`(`SimilarJobs`)와 같은 한 줄
 * 카드이고, 회사명 앞에 `광고` 를 붙인다. 지금 보는 공고는 뺀다. 공고와 부트캠프가 섞여 올 수 있다.
 *
 * 좁은 화면에서는 사이드바가 본문 아래로 내려가므로 이 묶음도 본문 아래다. 보일 광고가 없으면 아무것도 그리지 않는다.
 *
 * 노출은 칸마다 `IMPRESSION`, 누르면 `ad_posting_click` 과 `AD_CLICK` 이다. 일반 목록 칸이 아니라 `job_card_click`
 * 은 보내지 않는다(`list_source` 허용값에 이 자리가 없다).
 */
export async function SideAdPostings({ excludeJobId }: { excludeJobId: number }) {
  const postings = (await fetchAdPostings('JOB_DETAIL_SIDE'))
    .filter((posting) => !(posting.targetType === 'JOB' && posting.job?.id === excludeJobId))
    .slice(0, MAX_AD_POSTINGS);

  const items = postings.flatMap((posting, index): SideItem[] => {
    const ad = toAdSlot(posting, index + 1);
    if (posting.job) {
      const { job } = posting;
      return [{ ad, kind: 'job', id: job.id, summary: job, coverImageUrl: job.coverImageUrl }];
    }
    if (posting.bootcamp) {
      const { bootcamp } = posting;
      return [
        {
          ad,
          kind: 'bootcamp',
          id: bootcamp.id,
          summary: bootcamp,
          coverImageUrl: bootcamp.representativeImageUrl ?? bootcamp.logoUrl,
        },
      ];
    }
    return [];
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">함께 보면 좋은 공고</h2>
      <ul className="mt-1 divide-y divide-gray-100">
        {items.map(({ ad, kind, id, summary, coverImageUrl }) => {
          const targetType = kind === 'job' ? 'JOB' : 'BOOTCAMP';
          const href = kind === 'job' ? `/jobs/${id}` : `/bootcamps/${id}`;
          const adClick = {
            exposureId: ad.adId,
            source: 'AD_CARD',
            target: { targetType, targetId: id },
          } as const;
          const body = (
            <>
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-center gap-1 text-xs text-gray-500">
                  <AdLabel />
                  <span className="truncate">{summary.companyName}</span>
                </p>
                <p className="mt-1 line-clamp-2 break-keep text-pretty break-words text-sm font-bold text-gray-800 transition-colors group-hover:text-blue-500">
                  {summary.title}
                </p>
              </div>
              <div className="w-24 shrink-0">
                <JobThumbnail
                  companyName={summary.companyName}
                  coverImageUrl={coverImageUrl}
                  logoUrl={summary.logoUrl}
                />
              </div>
            </>
          );
          const className = 'group flex items-center gap-4 py-4';
          return (
            <li key={ad.adId}>
              <ImpressionTracker
                contentEvent={{
                  type: 'IMPRESSION',
                  targetType,
                  targetId: id,
                  exposureId: ad.adId,
                  source: 'AD_CARD',
                }}
              >
                {kind === 'job' ? (
                  <JobCardLink
                    href={href}
                    className={className}
                    jobId={id}
                    extraEvents={[adPostingClickEvent(ad, 'job', id)]}
                    adClick={adClick}
                  >
                    {body}
                  </JobCardLink>
                ) : (
                  <TrackedLink
                    href={href}
                    className={className}
                    events={[adPostingClickEvent(ad, 'bootcamp', id)]}
                    adClick={adClick}
                  >
                    {body}
                  </TrackedLink>
                )}
              </ImpressionTracker>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
