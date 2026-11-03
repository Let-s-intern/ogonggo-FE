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

/** `11.09(월)`. 날짜 문자열(`yyyy-MM-dd`)을 그대로 읽는다 — 시간대를 타지 않게 `Date` 로 파싱하지 않는다. */
export function formatShortDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const weekday = '일월화수목금토'[new Date(year, month - 1, day).getDay()];
  return `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}(${weekday})`;
}

/** `11.09(월) ~ 11.15(일)`. */
export function formatPeriod(startDate: string, endDate: string): string {
  return `${formatShortDate(startDate)} ~ ${formatShortDate(endDate)}`;
}

/**
 * 광고 신청서로 가는 주소. 신청 가능 일정의 `이 일정으로 신청하기` 가 구좌·시작 주·직무를 실어 보내고, 신청서(Push 6)가
 * 2단계 항목을 미리 채운다. 채용공고 카드의 `광고로 더 알리기` 는 `jobId` 를 싣는다.
 */
export function adApplyHref(params: {
  placementKey?: string;
  startDate?: string;
  jobField?: string;
  jobId?: number;
}): string {
  const query = new URLSearchParams();
  if (params.jobId !== undefined) query.set('jobId', String(params.jobId));
  if (params.placementKey) query.set('placement', params.placementKey);
  if (params.startDate) query.set('start', params.startDate);
  if (params.jobField) query.set('jobField', params.jobField);
  const search = query.toString();
  return search ? `/apply?${search}` : '/apply';
}
