/**
 * 화면의 달력 날짜(`YYYY-MM-DD`) ↔ 백엔드의 일시(`YYYY-MM-DDTHH:mm:ss`).
 *
 * 기업 공고 요청의 모집 시작·마감(`recruitmentStartAt`·`recruitmentEndAt`) 과 부트캠프의 공개
 * 기간(`publicationStartAt`·`publicationEndAt`) 은 일시인데 목업의 칸은 날짜 하나이고, 칸
 * 아래 안내가 `마감 시간은 23:59로 설정됩니다.` 라고 적고 있다. 그 23:59 를 붙이는 자리가
 * 여기다.
 *
 * 시간대는 붙이지 않는다. 마감은 달력의 날짜이지 어느 시간대의 순간이 아니고, `Z` 를 붙이면
 * KST 에서 마감이 다음 날 아침 08:59 가 된다.
 */

/** 일시에서 달력 날짜만 꺼낸다. 값이 없으면 빈 칸이다. */
export function toDateInputValue(value?: string): string {
  return value?.slice(0, 10) ?? '';
}

/** 시작일은 그날 00:00:00 부터다. */
export function toStartDateTime(date: string): string | undefined {
  return date ? `${date}T00:00:00` : undefined;
}

/** 마감일은 그날 23:59:59 까지다(칸 아래 안내와 같다). */
export function toEndDateTime(date: string): string | undefined {
  return date ? `${date}T23:59:59` : undefined;
}
