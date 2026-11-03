import type {
  AdPlacement,
  AdPlacementPage,
  AdPlacementUnit,
} from '@ogonggo/api/src/mocks/fixtures/advertisement-types';

/** 구좌가 놓인 화면. 랜딩의 페이지 탭과 신청 가능 일정의 묶음 이름이다. 순서가 탭 순서다. */
export const AD_PAGE_LABELS: Record<AdPlacementPage, { label: string; url: string }> = {
  JOB_LIST: { label: '채용공고 리스트', url: 'ogonggo.co.kr' },
  BOOTCAMP_LIST: { label: '교육·부트캠프 리스트', url: 'ogonggo.co.kr/bootcamps' },
  JOB_DETAIL: { label: '채용공고 상세', url: 'ogonggo.co.kr/jobs/:id' },
  BOOTCAMP_DETAIL: { label: '교육·부트캠프 상세', url: 'ogonggo.co.kr/bootcamps/:id' },
  JOB_CALENDAR: { label: '공고 달력', url: 'ogonggo.co.kr/calendar' },
  MY_SCHEDULE: { label: '마이페이지 지원일정', url: 'ogonggo.co.kr/mypage/scraps' },
};

export const AD_PAGE_ORDER = Object.keys(AD_PAGE_LABELS) as AdPlacementPage[];

export const AD_UNIT_LABELS: Record<AdPlacementUnit, string> = {
  WEEK: '1주',
  POSTING_PERIOD: '공고 기간',
};

/** `400,000원`. */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/** 구좌의 판매 조건을 짧은 칩 글자로. 시안 상품 카드의 칩(`4슬롯 롤링`, `직무당 1슬롯`, `무료 쿠폰 대상`)이다. */
export function placementChips(placement: AdPlacement): string[] {
  const slots = `${placement.perJobField ? '직무당 ' : ''}${placement.unit === 'POSTING_PERIOD' ? '월 ' : ''}${placement.slotCount}슬롯${placement.rolling ? ' 롤링' : ''}`;
  return [slots, placement.spec, ...(placement.couponEligible ? ['무료 쿠폰 대상'] : [])];
}
