import { formatDateDots } from '@/shared/lib/localDate';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** 시각 뒤에 `Z` 나 `+09:00` 같은 시간대가 붙어 있는지. */
const HAS_ZONE_PATTERN = /T.*(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/**
 * 고민글·답변의 시각 문구(`방금 전`, `N분 전`, `N시간 전`, `N일 전`). 일주일이 지나면 날짜(`2026.10.03`)
 * 로 쓴다. 문구는 사이드·스터디 댓글의 `features/recruitment-post-comments/lib/relativeTime.ts` 와
 * 같다.
 *
 * 다른 점이 하나 있다. `createdAt` 은 시간대 없는 `LocalDateTime` 이다(`2026-09-29T10:00:00`).
 * 댓글 쪽은 이 문자열을 `new Date` 에 그대로 넣어 실행하는 쪽의 시간대로 읽는데, 댓글이 브라우저에서만
 * 그려져서 괜찮았다. 고민글 목록은 서버(UTC) 에서도 그려지므로 그대로 두면 서버가 아홉 시간 어긋난다.
 * 그래서 시간대가 없으면 한국 시간(+09:00) 으로 읽는다 — 백엔드와 사용자가 모두 한국 시간이라는
 * 전제는 같다. 날짜는 `Date` 를 거치지 않고 글자를 잘라 쓴다(`formatDateDots`).
 *
 * 읽지 못하면 빈 문자열이다. 시계가 어긋나 미래 시각이 오면 `방금 전` 으로 묶는다.
 */
export function formatRelativeTime(value: string, now: number = Date.now()): string {
  const time = new Date(HAS_ZONE_PATTERN.test(value) ? value : `${value}+09:00`).getTime();
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
  return formatDateDots(value);
}
