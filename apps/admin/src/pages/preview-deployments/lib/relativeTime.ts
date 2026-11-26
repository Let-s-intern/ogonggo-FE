const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * ISO 8601 을 `방금 전`, `5분 전`, `3시간 전`, `2일 전` 으로. 일주일이 넘으면 날짜를 그대로 보인다.
 *
 * `now` 를 받아 쓴다. 화면이 시계를 들고 있어야 데이터가 그대로여도 `5분 전` 이 `6분 전` 으로 넘어간다.
 */
export function formatRelativeTime(iso: string, now: number): string {
  const elapsed = now - new Date(iso).getTime();
  // 서버와 브라우저 시계가 조금 어긋나면 음수가 나온다. 미래로 보이지 않게 방금 전으로 둔다.
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
  return new Date(iso).toLocaleDateString('ko-KR');
}
