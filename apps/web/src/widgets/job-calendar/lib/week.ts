/**
 * 주(週) 계산. 조회 범위를 잡는 `JobCalendarView`(서버)와 제목을 그리는 `CalendarHeader`
 * (클라이언트)가 같은 답을 내야 해서 한 곳에 둔다 — 격자가 보여주는 주와 제목의 주차가
 * 어긋나면 어느 쪽이 맞는지 알 방법이 없다.
 */

/** 격자의 첫 요일. 목업(`docs/asset/공고달력.png`)이 `MON`~`SUN`이다. */
export const CALENDAR_FIRST_DAY = 1;

/** 하루짜리 이동. 달을 넘기는 계산은 `Date` 생성자가 알아서 한다. */
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** 그 날이 든 주의 월요일. 시각은 자정으로 떨어진다. */
export function startOfCalendarWeek(date: Date): Date {
  const offset = (date.getDay() - CALENDAR_FIRST_DAY + 7) % 7;
  return addDays(date, -offset);
}

/** 화살표 한 번이 옮기는 만큼. 주간이라 7일이고, 요일은 그대로 유지된다. */
export function shiftWeeks(date: Date, delta: number): Date {
  return addDays(date, delta * 7);
}

/**
 * 주간 제목의 `YYYY.MM N주차`(목업은 `2026.08 3주차`, 8월 17일~23일 주).
 *
 * 달을 걸친 주가 어느 달의 몇 주차인지는 목업이 정해 주지 않아 **그 주의 목요일이 든 달**로
 * 정했다(2026-09-02, ISO 8601 이 해를 정하는 규칙과 같다). 목요일은 월요일 시작 주의 한가운데라
 * 이 규칙은 곧 "7일 중 4일 이상이 든 달"이고, 그래서 8월 31일~9월 6일 주가 `2026.09 1주차`가
 * 된다 — 그 주의 월요일로 정하면 하루뿐인 8월이 이겨 `2026.08 5주차`가 된다.
 *
 * 대신 1일이 금·토·일이면 그 주는 앞 달의 마지막 주차로 불린다(예: 2024년 3월 1일은 금요일이라
 * `2024.02 5주차`). 어느 규칙을 골라도 한쪽은 이렇게 어긋나고, 주차 번호가 건너뛰거나 겹치지
 * 않는 것은 두 규칙 모두 같다.
 *
 * 목업의 주(월요일 8월 17일)는 목요일이 8월 20일이라 두 규칙 어느 쪽으로 계산해도 3주차다 —
 * 목업만으로는 갈리지 않아 위 근거로 골랐다.
 */
export function formatWeekTitle(date: Date): string {
  const thursday = addDays(startOfCalendarWeek(date), 3);
  const month = String(thursday.getMonth() + 1).padStart(2, '0');
  const week = Math.floor((thursday.getDate() - 1) / 7) + 1;
  return `${thursday.getFullYear()}.${month} ${week}주차`;
}

/** 월간 제목의 `YYYY.MM`. */
export function formatMonthTitle(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}
