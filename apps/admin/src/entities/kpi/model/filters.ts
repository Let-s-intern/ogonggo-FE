import type { RedashParameterValue } from '@/shared/api/redash';

/**
 * 통계 화면 상단 필터와 Redash 파라미터의 대응.
 *
 * 선택지는 Redash 대시보드 `[오늘의공고] KPI 대시보드 v2`(46번) 쿼리의 enum 옵션을 그대로 옮겼다
 * (2026-10-20). Redash 는 이 목록 밖의 값을 거절하므로, Redash 쪽 옵션을 바꾸면 여기도 바꾼다.
 */

const ALL = '전체';

export const PERIOD_OPTIONS = ['일간', '주간', '월간'];

export const CHANNEL_OPTIONS = [
  ALL,
  '직접유입',
  '구글 검색',
  '네이버 검색',
  '기타 검색',
  '인스타그램',
  '카카오톡',
  '렛츠커리어',
  'AI 검색',
  '기타',
];

export const JOB_CATEGORY_OPTIONS = [
  ALL,
  '마케팅·광고',
  '기획·전략',
  'HR·총무',
  '영업',
  'IT·개발',
  '무역·물류',
  '엔지니어링·R&D',
  '공공·복지',
  '게임',
  '법률·법무',
  '생산·기능직',
  '교육',
  '서비스',
  '의료·보건',
  '건설·건축',
];

export const EXPERIENCE_OPTIONS = [ALL, '신입', '경력', '신입·경력', '경력무관'];

/** 공고별 성과 표에만 걸리는 기간. 위의 기간과 따로 움직인다. */
export const WINDOW_OPTIONS = ['최근 7일', '최근 30일', '누적'];

export const RANGE_OPTIONS = [
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
  { value: 'this-month', label: '이번 달' },
  { value: 'last-month', label: '지난 달' },
  { value: 'custom', label: '직접 입력' },
] as const;

export type RangePreset = (typeof RANGE_OPTIONS)[number]['value'];

export interface KpiFilters {
  range: RangePreset;
  /** `range` 가 `custom` 일 때만 읽는다. `YYYY-MM-DD`. */
  start: string;
  end: string;
  period: string;
  channel: string;
  jobCategory: string;
  experience: string;
  window: string;
}

/** Redash 대시보드의 기본값과 같다. */
export const DEFAULT_KPI_FILTERS: KpiFilters = {
  range: '30d',
  start: '',
  end: '',
  period: '일간',
  channel: ALL,
  jobCategory: ALL,
  experience: ALL,
  window: '최근 7일',
};

/** 서비스 지표는 한국 시간으로 끊는다(Redash 쿼리의 DB 집계가 KST 다). */
function todayInSeoul(): Date {
  // `en-CA` 는 `2026-10-20` 꼴로 쓴다.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  return new Date(`${today}T00:00:00Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** 프리셋을 실제 날짜 범위로 바꾼다. 양 끝을 포함한다. */
export function resolveDateRange(filters: KpiFilters): { start: string; end: string } {
  const today = todayInSeoul();
  switch (filters.range) {
    case '7d':
      return { start: toIsoDate(addDays(today, -6)), end: toIsoDate(today) };
    case '30d':
      return { start: toIsoDate(addDays(today, -29)), end: toIsoDate(today) };
    case '90d':
      return { start: toIsoDate(addDays(today, -89)), end: toIsoDate(today) };
    case 'this-month':
      return {
        start: toIsoDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))),
        end: toIsoDate(today),
      };
    case 'last-month':
      return {
        start: toIsoDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1))),
        end: toIsoDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0))),
      };
    case 'custom':
      return { start: filters.start, end: filters.end };
  }
}

/** 화면이 쓰는 Redash 쿼리. 번호는 `api/redash-query.ts` 의 허용 목록과 같다. */
export const KPI_QUERY = {
  /** 1. KPI 기간별 (GA4) */
  periodKpi: 365,
  /** 1.2 회원가입 기간별 (DB) */
  signups: 366,
  /** 1.1.2 재방문율 · 1.6 신규 활성화율 (GA4, 주간) */
  weeklyRetention: 367,
  /** 2.1 공고 수 (DB) */
  jobCounts: 368,
  /** 2.2 공고별 성과 (GA4) */
  jobPerformance: 369,
  /** 3.1 채널별 KPI (GA4) */
  channelKpi: 370,
  /** 3.1 채널별 방문자 추이 (GA4) */
  channelTrend: 371,
  /** 3.2 검색 유입 랜딩 페이지 (GA4) */
  searchLanding: 372,
} as const;

type RedashParameterName =
  | 'date_range'
  | 'period'
  | 'channel'
  | 'job_category'
  | 'experience'
  | 'window';

/** 쿼리마다 받는 파라미터. 받지 않는 필터는 보내지 않는다 — 바꿔도 그 쿼리를 다시 부르지 않는다. */
const QUERY_PARAMETERS: Record<number, RedashParameterName[]> = {
  [KPI_QUERY.periodKpi]: ['date_range', 'period', 'channel', 'job_category', 'experience'],
  [KPI_QUERY.signups]: ['date_range', 'period'],
  [KPI_QUERY.weeklyRetention]: ['date_range', 'channel', 'job_category', 'experience'],
  [KPI_QUERY.jobCounts]: ['date_range', 'period', 'job_category', 'experience'],
  [KPI_QUERY.jobPerformance]: ['channel', 'job_category', 'experience', 'window'],
  [KPI_QUERY.channelKpi]: ['date_range', 'job_category', 'experience'],
  [KPI_QUERY.channelTrend]: ['date_range', 'period'],
  [KPI_QUERY.searchLanding]: ['date_range', 'channel'],
};

export function toRedashParameters(
  queryId: number,
  filters: KpiFilters,
): Record<string, RedashParameterValue> {
  const values: Record<RedashParameterName, RedashParameterValue> = {
    date_range: resolveDateRange(filters),
    period: filters.period,
    channel: filters.channel,
    job_category: filters.jobCategory,
    experience: filters.experience,
    window: filters.window,
  };
  return Object.fromEntries((QUERY_PARAMETERS[queryId] ?? []).map((name) => [name, values[name]]));
}

/** 직접 입력인데 날짜가 비었거나 거꾸로면 부르지 않는다. */
export function isDateRangeComplete(filters: KpiFilters): boolean {
  const { start, end } = resolveDateRange(filters);
  return Boolean(start && end && start <= end);
}
