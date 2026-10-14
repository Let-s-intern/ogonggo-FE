/**
 * 백엔드 시각은 시간대가 없는 한국 시간(`2026-10-14T00:00:00.365861`)이다. 시각이 있는데 시간대가
 * 없으면 W3C Datetime·ISO 8601 형식이 아니라 Search Console 이 사이트맵 `lastmod` 를 잘못된 날짜로
 * 거부하고, 구조화 데이터의 날짜도 시간대를 잘못 읽는다. 이미 시간대가 붙은 값은 그대로 둔다.
 */
export const withKstOffset = (localDateTime?: string) =>
  !localDateTime || /[zZ]|[+-]\d{2}:\d{2}$/.test(localDateTime)
    ? localDateTime
    : `${localDateTime}+09:00`;
