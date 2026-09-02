/**
 * `MonthGrid`와 `WeekGrid`가 함께 쓰는 FullCalendar 배선. 두 뷰는 서로 다른 컴포넌트이고
 * `?brief=1`에 따라 통째로 갈아끼워지지만(`JobCalendarView`), 같은 라이브러리를 감싸므로
 * 여기 있는 것들은 어느 쪽에서도 똑같아야 한다.
 *
 * 여기 없는 것은 각자의 파일에 있다 — 로고 타일과 `+N`은 월간, 가로 막대는 주간이다.
 * 두 곳에서 쓰지 않는 것은 여기로 올리지 않는다.
 */
import { useEffect, type RefObject } from 'react';
import type FullCalendar from '@fullcalendar/react';
import type { CSSProperties } from 'react';

/** 목업의 요일 머리글은 `MON`~`SUN`이다. FullCalendar 기본값은 로케일 약어라 직접 넘긴다. */
const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** 그 날짜의 요일 머리글. 월요일이 0번이 되도록 일요일 기준 인덱스를 6칸 민다. */
export function weekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[(date.getDay() + 6) % 7] as string;
}

/**
 * FullCalendar 가 CSS 변수로 내놓는 색은 변수로 덮는다 — 선택자 명시도 싸움을 안 해도 된다.
 */
export const GRID_STYLE = {
  '--fc-border-color': 'var(--color-gray-200)',
  '--fc-today-bg-color': 'transparent',
} as CSSProperties;

/**
 * 두 뷰가 함께 쓰는 격자 스타일.
 *
 * 스타일은 FullCalendar 가 스스로 주입하는 기본 CSS 위에 저장소 토큰으로 덮는다. 전역
 * 스타일시트를 건드리지 않으려고 임의 변형 선택자(`[&_.fc-...]`)로 감싼 요소 안에만
 * 적용한다 — `MiniCalendarPopover`가 `classNames`로 하는 것과 같은 이유다.
 *
 * 덮는 방법은 셋이고 상황에 따라 갈린다.
 * 1. FullCalendar 가 CSS 변수로 내놓는 값(테두리 색, 오늘 배경)은 변수로 덮는다(`GRID_STYLE`).
 * 2. FullCalendar 가 건드리지 않는 속성(글자색, flex 배치)은 그냥 유틸리티로 덮는다.
 * 3. FullCalendar 가 잡는 속성(이벤트 테두리·배경, 격자 세로선, `opacity`)은 `!`를 붙인다 —
 *    유틸리티는 `@layer utilities` 안이라 레이어 밖 규칙에게 명시도와 무관하게 진다.
 */
export const GRID_CLASSES = [
  'w-full',
  // 세로 선과 바깥 테두리는 목업에 없다. 가로 선만 남긴다. `!`가 붙은 이유는
  // `EVENT_RESET_CLASSES` 주석과 같다 — FullCalendar 가 같은 속성을 레이어 밖에서 잡는다.
  '[&_.fc-scrollgrid]:border-0!',
  '[&_.fc-theme-standard_td]:border-x-0! [&_.fc-theme-standard_th]:border-x-0!',
];

/**
 * 항목에서 FullCalendar 기본 껍데기를 벗기는 클래스.
 *
 * `!`(Tailwind v4 의 important 표기, 뒤에 붙는다)가 필요하다. 이 저장소의 유틸리티는
 * `@layer utilities` 안에 있고 FullCalendar 는 CSS 를 레이어 밖에서 런타임에 주입하므로,
 * **명시도를 아무리 올려도 레이어 밖 규칙을 못 이긴다** — `.fc-h-event`의
 * `background-color: var(--fc-event-bg-color); border: 1px solid var(--fc-event-border-color)`
 * (기본값 `#3788d8`)가 그대로 남아 로고마다 파란 액자가 보였다. `!` 선언은 레이어와 무관하게
 * 이긴다.
 *
 * 여백까지 0인 것은 FullCalendar 가 항목의 시작·끝 쪽에 2px 씩 넣기 때문이다. 월간 타일에서는
 * 한 줄에 4개가 안 들어가게 만들고, 주간 막대에서는 막대가 칸 끝에 닿지 못하게 만든다.
 */
export const EVENT_RESET_CLASSES = ['border-0!', 'bg-transparent!', 'p-0!', 'm-0!'];

/**
 * 보고 있는 날짜를 FullCalendar 인스턴스에 따라붙게 한다.
 *
 * `initialDate` 는 이름 그대로 처음 한 번만 읽힌다. 날짜 이동 줄의 화살표는 같은 라우트 안의
 * 이동이라 React 가 격자를 다시 마운트하지 않고, `events` 는 새 달의 것으로 바뀌는데 격자는
 * 처음 그린 달에 그대로 머문다. 보고 있는 날짜를 명령형 API 로 따라가게 한다 — `key` 를 걸어
 * 통째로 다시 마운트하는 방법도 있지만 화살표 한 번에 격자 전체를 새로 만든다.
 *
 * 마이크로태스크로 미루는 것은 `gotoDate` 가 안에서 `flushSync` 를 부르기 때문이다. `<Link>`
 * 이동은 트랜지션 안에서 일어나 이 이펙트가 React 가 아직 렌더 중일 때 실행되고, 그대로 부르면
 * 이동 한 번에 `flushSync was called from inside a lifecycle method` 경고가 수백 건 쌓인다.
 *
 * 뷰 전환(`?brief=1`)에는 이 함정이 없다. 월간과 주간이 서로 다른 컴포넌트라 토글하면 새로
 * 마운트되고, 그때는 `initialDate` 가 제 이름대로 동작한다.
 */
export function useCalendarDate(ref: RefObject<FullCalendar | null>, date: string): void {
  useEffect(() => {
    queueMicrotask(() => ref.current?.getApi().gotoDate(date));
  }, [ref, date]);
}
