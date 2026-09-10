/** ISO 8601 -> `2026. 9. 10.` 목록 칸에 쓰는 짧은 형식이다. */
export function formatDate(iso: string | undefined): string {
  if (!iso) {
    return '-';
  }
  return new Date(iso).toLocaleDateString('ko-KR');
}

/** ISO 8601 -> `2026. 9. 10. 오후 3:01` 상세에서 시각까지 보여줄 때. */
export function formatDateTime(iso: string | undefined): string {
  if (!iso) {
    return '-';
  }
  return new Date(iso).toLocaleString('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** 천 단위 구분. 없는 값은 `-` 로 둔다 — 0 과 구분되어야 한다. */
export function formatCount(value: number | undefined): string {
  return value === undefined ? '-' : value.toLocaleString('ko-KR');
}

/** 비율을 소수 한 자리 퍼센트로. 분모가 0 이면 `-`. */
export function formatRate(numerator: number, denominator: number): string {
  if (denominator === 0) {
    return '-';
  }
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

/** `YYYY-MM-DD` — `input[type=date]` 에 넣을 값. */
export function toDateInputValue(iso: string | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}
