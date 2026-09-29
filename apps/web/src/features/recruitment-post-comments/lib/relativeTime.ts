const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * 댓글 시각 문구(목업의 `N시간 전`). 일주일이 지나면 날짜로 쓴다 — `43일 전` 은 언제인지 한 번
 * 더 셈해야 한다.
 *
 * `createdAt` 은 시간대 없는 `LocalDateTime` 문자열(`2026-09-29T10:00:00`) 이고, 자바스크립트는
 * 이런 문자열을 브라우저의 현지 시각으로 읽는다. 백엔드와 사용자가 모두 한국 시간이라는 전제다.
 * 읽지 못하면 빈 문자열이다. 시계가 어긋나 미래 시각이 오면 `방금 전` 으로 묶는다.
 */
export function formatRelativeTime(value: string, now: number = Date.now()): string {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return '';
  }
  const elapsed = now - time;
  if (elapsed < MINUTE) {
    return '방금 전';
  }
  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}분 전`;
  }
  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}시간 전`;
  }
  if (elapsed < 7 * DAY) {
    return `${Math.floor(elapsed / DAY)}일 전`;
  }
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}.${month}.${day}`;
}
