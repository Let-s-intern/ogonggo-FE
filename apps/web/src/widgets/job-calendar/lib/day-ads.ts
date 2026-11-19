import type { UserJobCalendarItemResponse } from '@ogonggo/api';
import type { AdSlot } from '@/shared/ads/adPosting';
import { fetchAdPostings, MAX_AD_POSTINGS, toAdSlot } from '@/shared/ads/fetchAdPostings';

/**
 * 고른 날짜 목록 맨 앞의 광고 공고 한 칸(`CALENDAR_DAY`, 공고 달력 날짜별 공고, 계약 8절). 카드는 그날 공고 카드와
 * 같은 모양이라 달력 항목 모양으로 옮겨 둔다. `startAt`·`endAt` 은 노출 기간(KST, 오프셋 없음)이고 없으면 그쪽 끝이
 * 열려 있다.
 */
export interface DayAd {
  job: UserJobCalendarItemResponse;
  ad: AdSlot;
  startAt: string | null;
  endAt: string | null;
}

/**
 * 공고 달력 광고 공고. 서버가 지금 노출 중인 것만 주고, 날짜별로 보일지는 `dayAdsOn` 이 노출 기간으로 가른다. 많아야
 * `MAX_AD_POSTINGS` 칸이다.
 *
 * 공개 요약 응답의 모집 시작·마감일은 비어 있을 수 있다(상시 채용). 달력 항목 모양에는 필수라 빈 문자열로 둔다 —
 * 카드는 빈 날짜면 D-day 와 반대쪽 날짜를 그리지 않는다.
 */
export async function fetchDayAds(): Promise<DayAd[]> {
  const postings = await fetchAdPostings('CALENDAR_DAY');
  return postings
    .flatMap((posting) => (posting.job ? [{ ...posting, job: posting.job }] : []))
    .slice(0, MAX_AD_POSTINGS)
    .map((posting, index) => {
      const { job } = posting;
      return {
        job: {
          id: job.id,
          companyName: job.companyName,
          title: job.title,
          coverImageUrl: job.coverImageUrl,
          logoUrl: job.logoUrl,
          employmentType: job.employmentType,
          experienceType: job.experienceType,
          jobField: job.jobField,
          jobRole: job.jobRole,
          recruitmentStartAt: job.recruitmentStartAt ?? '',
          recruitmentEndAt: job.recruitmentEndAt ?? '',
          bookmarked: job.bookmarked,
        },
        ad: toAdSlot(posting, index + 1),
        startAt: posting.startAt ?? null,
        endAt: posting.endAt ?? null,
      };
    });
}

/**
 * `day`(`YYYY-MM-DD`)가 노출 기간과 하루라도 겹치는 광고만, 원래 차례대로. 칸 번호(`ad.position`)는 그날 보이는 차례로
 * 다시 매긴다. 끝 시각은 그 시각을 넣지 않는다(어드민이 `종료일 다음 날 00:00` 으로 건다).
 */
export function dayAdsOn(ads: readonly DayAd[], day: string): DayAd[] {
  const dayStart = `${day}T00:00:00`;
  const dayEnd = `${day}T23:59:59`;
  return ads
    .filter(({ startAt, endAt }) => (!startAt || startAt <= dayEnd) && (!endAt || endAt > dayStart))
    .map((dayAd, index) => ({ ...dayAd, ad: { ...dayAd.ad, position: index + 1 } }));
}
