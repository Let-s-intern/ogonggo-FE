/**
 * 백엔드 시각은 시간대가 없는 한국 시간(`2026-11-05T09:30:00`)이다. 그대로 `Date` 에 넣으면 브라우저 시간대로 읽혀
 * 한국 밖에서는 시각과 날짜가 어긋난다. `+09:00` 을 붙여 읽는다. 이미 시간대가 붙은 값은 그대로 둔다. 사용자 웹의
 * `apps/web/src/shared/lib/kstDateTime.ts` 와 같다.
 */
export const withKstOffset = (localDateTime: string): string =>
  /[zZ]|[+-]\d{2}:\d{2}$/.test(localDateTime) ? localDateTime : `${localDateTime}+09:00`;
