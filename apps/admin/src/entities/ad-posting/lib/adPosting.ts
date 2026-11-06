import type { AdPostingPlacement } from '@ogonggo/api/src/ad-postings';
import type { AdPosting } from '../api/useAdPostings';

export const AD_PLACEMENT_LABELS: Record<AdPostingPlacement, string> = {
  JOB_LIST: '채용공고 목록',
  JOB_PICK: '오공고 PICK',
  BOOTCAMP_LIST: '부트캠프 목록',
  JOB_DETAIL_SIDE: '공고 상세',
  CALENDAR: '공고 달력',
  MYPAGE_SCRAP: '마이페이지 스크랩',
};

/** 탭 아래 설명. 웹의 어느 목록 몇 번째 칸에 들어가는지 적는다(웹 `shared/ads/adPosting.ts` 의 `placeAdsFirst`). */
export const AD_PLACEMENT_DESCRIPTIONS: Record<AdPostingPlacement, string> = {
  JOB_LIST: '채용공고 홈 전체 공고 카드 목록의 1쪽 맨 앞. 2쪽부터는 나오지 않습니다.',
  JOB_PICK:
    '홈 오늘의 추천 공고 첫 탭(오공고 PICK, 비어 있으면 인기 공고) 맨 앞. 추천 문구 상자는 붙지 않습니다.',
  BOOTCAMP_LIST: '교육·부트캠프 카드 목록의 1쪽 맨 앞. 2쪽부터는 나오지 않습니다.',
  JOB_DETAIL_SIDE:
    '공고 상세 사이드바 비슷한 공고 목록 맨 앞. 보고 있는 공고의 광고는 그 공고 상세에서 빠집니다.',
  CALENDAR: '공고 달력 월간 보기의 날짜별 목록 맨 앞. 어느 날을 골라도 같은 광고가 나옵니다.',
  MYPAGE_SCRAP:
    '마이페이지 지원 보드 채용공고 스크랩 칸 맨 앞(PC 칸반 보기). 이미 스크랩한 사람에게는 나오지 않습니다.',
};

/** KST 벽시계 시각(`YYYY-MM-DDTHH:mm:ss`)을 시각으로. */
function kstTime(value: string): number {
  return Date.parse(`${value}+09:00`);
}

export type AdPostingStatus = 'LIVE' | 'SCHEDULED' | 'ENDED' | 'OFF' | 'UNAVAILABLE';

/** 지금 웹에 나가는지. 켜짐·기간에 더해 대상이 공개·모집 중이어야 한다(공개 조회의 규칙과 같다). */
export function adPostingStatus(ad: AdPosting, now = Date.now()): AdPostingStatus {
  if (!ad.enabled) return 'OFF';
  if (ad.startAt !== null && now < kstTime(ad.startAt)) return 'SCHEDULED';
  if (ad.endAt !== null && kstTime(ad.endAt) <= now) return 'ENDED';
  if (!ad.targetAvailable) return 'UNAVAILABLE';
  return 'LIVE';
}
