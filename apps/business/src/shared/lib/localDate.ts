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

const DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * `YYYY-MM-DD` 로 시작하는 날짜·일시 문자열의 날짜 부분만 `YYYY.MM.DD` 로 바꾼다. 형식이
 * 어긋나면 받은 값을 그대로 돌려준다.
 *
 * `Date` 를 거치지 않고 글자만 자른다. 공지사항의 `createdAt` 은 백엔드가 `LocalDateTime` 으로
 * 내보내 시간대가 붙지 않는데(`UserNoticeResponses.kt`), 그 값을 `new Date` 에 넣으면 실행하는
 * 쪽 시간대로 해석되어 서버(UTC) 와 브라우저(KST) 에서 하루가 어긋날 수 있다. 자르기만 하면
 * 어디서 그리든 같은 날짜가 나온다.
 */
export function formatDateDots(value: string): string {
  const match = DATE_PREFIX_PATTERN.exec(value);
  if (!match) {
    return value;
  }
  const [, year, month, day] = match;
  return `${year}.${month}.${day}`;
}
