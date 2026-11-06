'use client';

import { toJobBoardItem } from '@/features/application-board';
import { toJobInfo } from '@/entities/job/model/analytics';
import { JobCardLink } from '@/entities/job/ui/JobCardLink';
import { adParams, adPostingClickEvent } from '@/shared/ads/adPosting';
import { AdLabel } from '@/shared/ads/AdLabel';
import { useAdJobs } from '@/shared/ads/useAdJobs';
import { ApplicationBoardCardBody } from './ApplicationBoardCard';

/**
 * 채용공고 보드 `스크랩` 칸 맨 앞의 광고 공고(`MYPAGE_SCRAP`, 이슈 #573). 칸의 카드와 같은 모양(`ApplicationBoardCardBody`)에
 * `광고` 표시를 붙인다.
 *
 * 내 카드와 달리 끌 수 없고 누르면 공고 상세로 간다. 칸 머리의 건수에는 세지 않는다. 이미 스크랩한 공고의 광고는
 * 그리지 않는다 — 내 카드가 이미 그 칸에 있다. 내 카드를 빼면 보드의 이동·건수가 어긋나므로 광고 쪽을 뺀다.
 */
export function ApplicationBoardAdCards({ scrappedIds }: { scrappedIds: Set<number> }) {
  const { data = [] } = useAdJobs('MYPAGE_SCRAP');
  const ads = data.filter((ad) => !scrappedIds.has(ad.item.id));

  return ads.map(({ slot, item: job }, index) => (
    <JobCardLink
      key={`ad-${slot.adId}`}
      href={`/jobs/${job.id}`}
      jobId={job.id}
      jobInfo={{ ...toJobInfo(job), ...adParams(slot) }}
      tracking={{ listSource: 'scrap', listPosition: index + 1, pageNumber: 1 }}
      extraEvents={[adPostingClickEvent(slot, 'job', job.id)]}
      className="block rounded-xl bg-white"
    >
      <ApplicationBoardCardBody tab="jobs" item={toJobBoardItem(job)} label={<AdLabel />} />
    </JobCardLink>
  ));
}
