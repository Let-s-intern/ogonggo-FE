const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * 날짜 문자열을 `Date` 로 읽는다. 시각 없는 `YYYY-MM-DD` 는 로컬 자정으로 만든다.
 *
 * `new Date('2026-09-18')` 은 명세상 UTC 자정이라 KST 에서는 같은 날 09:00, UTC 보다 늦은
 * 시간대에서는 전날이 된다. 사이드·스터디의 모집 시작·마감일(`recruitmentStartDate`,
 * `recruitmentEndDate`) 이 이 형식이라 시간대 없이 달력 날짜 그대로 다뤄야 한다. 시각이 붙은
 * 일시 문자열(채용공고·부트캠프의 `recruitmentEndAt`) 은 지금처럼 `new Date` 에 맡긴다.
 */
export function parseLocalDate(value: string): Date {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) {
    return new Date(value);
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}
