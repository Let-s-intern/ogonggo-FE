import type { GetNotificationBatchStatisticsParams } from '@ogonggo/api/src/admin';

/**
 * 발송 통계의 기간(`GET /notification-batches/statistics`). 화면은 한국 날짜 둘(양끝 포함)로 고르고, 요청은 서버가
 * 받는 `LocalDateTime`(시간대 없음, 한국 시간)으로 `from` 이상 `to` 미만을 보낸다.
 *
 * 서버 규칙(`AdminNotificationBatchStatisticsService`): 지금으로부터 30일 전보다 이르면 안 되고, `to` 는 지금 + 1일
 * 까지, 길이는 30일 이하. 날짜로 옮기면 시작은 오늘 - 29일부터, 끝은 오늘까지, 양끝 포함 30일 이하다 — 끝 날짜의
 * 다음 날 0시를 `to` 로 보내도 지금 + 1일을 넘지 않는다.
 */

export const PERIOD_MAX_DAYS = 30;

export interface StatisticsPeriod {
  /** `YYYY-MM-DD` */
  from: string;
  /** `YYYY-MM-DD`, 그날 끝까지 포함. */
  to: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function todayInSeoul(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

/** `YYYY-MM-DD` 에 날수를 더한다. 시간대와 무관하게 UTC 자정으로 셈한다. */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** 기본 기간: 오늘까지 최근 30일. */
export function recentPeriod(): StatisticsPeriod {
  const today = todayInSeoul();
  return { from: addDays(today, -(PERIOD_MAX_DAYS - 1)), to: today };
}

export function isRecentPeriod(period: StatisticsPeriod): boolean {
  const recent = recentPeriod();
  return period.from === recent.from && period.to === recent.to;
}

/** 고를 수 있는 날짜의 양끝. `input[type=date]` 의 `min`·`max` 다. */
export function periodBounds(): { min: string; max: string } {
  const today = todayInSeoul();
  return { min: addDays(today, -(PERIOD_MAX_DAYS - 1)), max: today };
}

/** 서버가 거절할 기간이면 그 까닭, 보낼 수 있으면 `undefined`. */
export function periodError(period: StatisticsPeriod): string | undefined {
  if (!period.from || !period.to) {
    return '시작일과 종료일을 모두 골라 주세요.';
  }
  if (period.from > period.to) {
    return '시작일은 종료일보다 늦을 수 없어요.';
  }
  const { min, max } = periodBounds();
  if (period.from < min || period.to > max) {
    return `최근 ${PERIOD_MAX_DAYS}일(${min} ~ ${max}) 안에서 고를 수 있어요.`;
  }
  return undefined;
}

export function toStatisticsParams(period: StatisticsPeriod): GetNotificationBatchStatisticsParams {
  return { from: `${period.from}T00:00:00`, to: `${addDays(period.to, 1)}T00:00:00` };
}
