import { formatDateDots } from './localDate';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** 시각 뒤에 `Z` 나 `+09:00` 같은 시간대가 붙어 있는지. */
const HAS_ZONE_PATTERN = /T.*(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/**
 * 글·댓글·알림의 시각 문구(`방금 전`, `N분 전`, `N시간 전`, `N일 전`). 일주일이 지나면 날짜(`2026.10.03`)
 * 로 쓴다 — `43일 전` 은 언제인지 한 번 더 셈해야 한다. 취준고민(`entities/concern`), 사이드·스터디 댓글
 * (`features/recruitment-post-comments`), 알림함(`features/notification-inbox`) 이 같이 쓴다. 앞의 두 곳은
 * 원래 각자 들고 있던 자리에서 이것을 다시 내보낸다.
 *
 * `createdAt` 은 시간대 없는 `LocalDateTime` 이다(`2026-09-29T10:00:00`). `new Date` 에 그대로 넣으면 실행하는
 * 쪽의 시간대로 읽어, 서버(UTC) 에서 그리면 아홉 시간 어긋난다. 그래서 시간대가 없으면 한국 시간(+09:00) 으로
 * 읽는다 — 백엔드와 사용자가 모두 한국 시간이라는 전제다. 날짜는 `Date` 를 거치지 않고 글자를 잘라 쓴다
 * (`formatDateDots`).
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
