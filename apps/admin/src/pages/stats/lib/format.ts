import type { RedashRow } from '@/shared/api/redash';

/**
 * Redash 컬럼 이름으로 단위를 정한다. 대시보드 설명대로 비율 지표는 이미 % 단위 숫자로 온다
 * (`4.6` 은 4.6%). 이름 끝이 `율`·`률`·`비율`·`비중` 인 컬럼이 그렇다.
 */
export function isPercentColumn(column: string): boolean {
  return /(율|률|비중)(-.+)?$/.test(column);
}

export function formatCell(column: string, value: RedashRow[string]): string {
  if (value === null || value === '') {
    return '-';
  }
  if (typeof value === 'number') {
    const text = value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
    return isPercentColumn(column) ? `${text}%` : text;
  }
  return value;
}

/** `2026-10-20T05:12:00Z` 를 `10월 20일 14:12` 로(한국 시간). */
export function formatRetrievedAt(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}
