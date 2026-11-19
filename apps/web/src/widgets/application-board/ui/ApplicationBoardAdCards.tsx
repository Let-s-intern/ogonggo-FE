'use client';

import { toJobBoardItem } from '@/features/application-board';
import { toJobInfo } from '@/entities/job/model/analytics';
import { JobCardLink } from '@/entities/job/ui/JobCardLink';
import { adParams, adPostingClickEvent } from '@/shared/ads/adPosting';
import { AdLabel } from '@/shared/ads/AdLabel';
import { MAX_AD_POSTINGS, toAdSlot } from '@/shared/ads/fetchAdPostings';
import { useAdPostings } from '@/shared/ads/useAdPostings';
import { ImpressionTracker } from '@/shared/analytics/ImpressionTracker';
import { ApplicationBoardCardBody } from './ApplicationBoardCard';

/**
 * 채용공고 보드 `스크랩` 칸 맨 앞의 광고 공고(`MYPAGE_SCRAP`, 마이페이지 스크랩 칸 공고, 계약 8절). 칸의 카드와 같은
 * 모양(`ApplicationBoardCardBody`)이고 `adLabel` 이 켜진 칸에 `AD` 를 붙인다. 칸반(PC 보드 보기)에만 있고 리스트 보기
 * (모바일)에는 없다.
 *
 * 내 카드와 달리 끌 수 없고 누르면 공고 상세로 간다. 칸 머리의 건수에는 세지 않는다. 이미 스크랩한 공고의 광고는
 * 그리지 않는다 — 내 카드가 이미 그 칸에 있다. 내 카드를 빼면 보드의 이동·건수가 어긋나므로 광고 쪽을 뺀다. 칸 번호는
 * 그 뒤에 남은 차례다.
 *
 * 노출 때 `IMPRESSION`, 누르면 `job_card_click`(광고 값)·`ad_posting_click`·`AD_CLICK` 이고 상세로 노출 id 를 넘긴다.
 */
export function ApplicationBoardAdCards({ scrappedIds }: { scrappedIds: Set<number> }) {
  const { data = [] } = useAdPostings('MYPAGE_SCRAP');
  const ads = data
    .flatMap((posting) =>
      posting.job && !scrappedIds.has(posting.job.id) ? [{ ...posting, job: posting.job }] : [],
    )
    .slice(0, MAX_AD_POSTINGS)
    .map((posting, index) => ({ job: posting.job, ad: toAdSlot(posting, index + 1) }));

  return ads.map(({ job, ad }, index) => (
    <ImpressionTracker
      key={`ad-${ad.adId}`}
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
        jobId={job.id}
        jobInfo={{ ...toJobInfo(job), ...adParams(ad) }}
        tracking={{ listSource: 'scrap', listPosition: index + 1, pageNumber: 1 }}
        extraEvents={[adPostingClickEvent(ad, 'job', job.id)]}
        adClick={{
          exposureId: ad.adId,
          source: 'AD_CARD',
          target: { targetType: 'JOB', targetId: job.id },
        }}
        className="block rounded-xl bg-white"
      >
        <ApplicationBoardCardBody
          tab="jobs"
          item={toJobBoardItem(job)}
          label={ad.adLabel ? <AdLabel /> : undefined}
        />
      </JobCardLink>
    </ImpressionTracker>
  ));
}
