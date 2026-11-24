import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
import { TUITION_TYPE_LABELS } from '@/entities/bootcamp/model/labels';
import { BootcampBadge } from '@/entities/bootcamp/ui/BootcampBadge';
import { adPostingClickEvent } from '@/shared/ads/adPosting';
import { AdLabel } from '@/shared/ads/AdLabel';
import { fetchAdPostings, toAdSlot } from '@/shared/ads/fetchAdPostings';
import { ImpressionTracker } from '@/shared/analytics/ImpressionTracker';
import { TrackedLink } from '@/shared/analytics/TrackedLink';

/**
 * 부트캠프 상세 옆 광고 공고(`BOOTCAMP_DETAIL_SIDE`, 계약 11절). 공고 상세 옆(`widgets/job-detail/ui/SideAdPostings.tsx`)을
 * 본떴다. 모양은 바로 아래 `비슷한 교육`(`SimilarBootcamps`)과 같은 한 줄 카드이고, `adLabel` 이 켜진 칸은 회사명 앞에
 * `AD` 를 붙인다. 대상은 부트캠프뿐이고 지금 보는 부트캠프는 뺀다.
 *
 * 개수 제한 없이 서버 순서대로 전부 쌓는다. 좁은 화면에서는 사이드바가 본문 아래로 내려가므로 이 묶음도 본문 아래다. 보일
 * 광고가 없으면 아무것도 그리지 않는다.
 *
 * 노출은 칸마다 `IMPRESSION`, 누르면 `ad_posting_click` 과 `AD_CLICK` 이고 상세로 노출 id 를 넘긴다. 일반 목록 칸이 아니라
 * `program_card_click` 은 보내지 않는다 — 공고 상세 옆이 `job_card_click` 을 보내지 않는 것과 같다.
 */
export async function SideAdBootcamps({ excludeBootcampId }: { excludeBootcampId: number }) {
  const items = (await fetchAdPostings('BOOTCAMP_DETAIL_SIDE'))
    .flatMap((posting) =>
      posting.bootcamp && posting.bootcamp.id !== excludeBootcampId
        ? [{ ...posting, bootcamp: posting.bootcamp }]
        : [],
    )
    .map((posting, index) => ({ bootcamp: posting.bootcamp, ad: toAdSlot(posting, index + 1) }));

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">함께 보면 좋은 교육</h2>
      <ul className="mt-1 divide-y divide-gray-100">
        {items.map(({ bootcamp, ad }) => (
          <li key={ad.adId}>
            <ImpressionTracker
              contentEvent={{
                type: 'IMPRESSION',
                targetType: 'BOOTCAMP',
                targetId: bootcamp.id,
                exposureId: ad.adId,
                source: 'AD_CARD',
              }}
            >
              <TrackedLink
                href={`/bootcamps/${bootcamp.id}`}
                prefetch={false}
                className="group flex items-center gap-4 py-4"
                events={[adPostingClickEvent(ad, 'bootcamp', bootcamp.id)]}
                adClick={{
                  exposureId: ad.adId,
                  source: 'AD_CARD',
                  target: { targetType: 'BOOTCAMP', targetId: bootcamp.id },
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-center gap-1 text-xs text-gray-500">
                    {ad.adLabel ? <AdLabel /> : null}
                    <span className="truncate">{bootcamp.companyName}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 break-keep text-pretty break-words text-sm font-bold text-gray-800 transition-colors group-hover:text-blue-500">
                    {bootcamp.title}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    <span className="truncate">
                      {TUITION_TYPE_LABELS[bootcamp.tuitionType]} · {bootcamp.programType}
                    </span>
                    <span className="shrink-0">
                      <BootcampBadge
                        recruitmentType={bootcamp.recruitmentType}
                        recruitmentEndAt={bootcamp.recruitmentEndAt}
                        status={bootcamp.status}
                      />
                    </span>
                  </p>
                </div>
                <div className="w-24 shrink-0">
                  <JobThumbnail
                    companyName={bootcamp.companyName}
                    coverImageUrl={bootcamp.representativeImageUrl ?? bootcamp.logoUrl}
                    logoUrl={bootcamp.logoUrl}
                  />
                </div>
              </TrackedLink>
            </ImpressionTracker>
          </li>
        ))}
      </ul>
    </section>
  );
}
