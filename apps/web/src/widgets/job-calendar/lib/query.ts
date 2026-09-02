/**
 * `/calendar` 이 URL 쿼리에 두는 상태(`?date=2026-08-19&brief=1`). 앞선 화면들의 탭·페이지네이션과
 * 같은 방식이고(`widgets/side-study-list/lib/query.ts`), 새로고침과 뒤로가기가 그대로 동작한다
 * (PRD 7절).
 *
 * `brief`(`간략히 보기`)는 주간 뷰 여부다(PRD 8.1). 값을 읽고 쓰는 자리는 여기가 전부이고,
 * 실제로 뷰를 갈아끼우는 것은 Push 3 이다.
 */
export interface JobCalendarQuery {
  /** 달력이 펼칠 기준 날짜. `?date=` 가 없거나 읽을 수 없으면 오늘이다. */
  date: Date;
  /** 켜면 주간, 끄면 월간. 기본은 월간이다(PRD 8.1). */
  brief: boolean;
}

export interface JobCalendarSearchParams {
  date?: string;
  brief?: string;
}

/** `brief` 가 켜졌다고 인정하는 유일한 값. 그 밖의 값은 전부 꺼짐이다. */
const BRIEF_ON = '1';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `YYYY-MM-DD`. `toISOString()`은 UTC로 바꾸므로 한국 시간대에서 하루 앞의 날짜가 나온다 —
 * 로컬 날짜를 그대로 적는다.
 */
export function toCalendarParam(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * `?date=` 문자열을 그대로 믿지 않는다. 모양이 다르면 물론이고, 모양은 맞는데 없는 날짜인
 * 경우(`2026-02-31`)도 통과시키지 않는다 — `new Date(2026, 1, 31)`은 오류가 아니라 3월 3일이
 * 되므로 만들어 본 값을 되돌려 확인해야 걸러진다.
 */
export function parseCalendarDate(value: string | undefined): Date | undefined {
  if (!value || !DATE_PATTERN.test(value)) {
    return undefined;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year!, month! - 1, day!);
  const roundTrips =
    parsed.getFullYear() === year && parsed.getMonth() === month! - 1 && parsed.getDate() === day;

  return roundTrips ? parsed : undefined;
}

/** 두 날짜가 같은 날인지. 시각은 보지 않는다. */
function isSameDay(a: Date, b: Date): boolean {
  return toCalendarParam(a) === toCalendarParam(b);
}

/**
 * `?date=`/`?brief=` 를 읽어 아는 값만 통과시킨다. 기준 날짜의 기본값은 `today` 이고,
 * 서버 컴포넌트가 요청마다 부르므로 빌드 시점의 날짜가 굳지 않는다.
 */
export function parseJobCalendarQuery(
  searchParams: JobCalendarSearchParams,
  today: Date = new Date(),
): JobCalendarQuery {
  return {
    date: parseCalendarDate(searchParams.date) ?? today,
    brief: searchParams.brief === BRIEF_ON,
  };
}

/**
 * 기본값은 URL 에서 생략한다 — 오늘이면 `date` 를, 월간이면 `brief` 를 붙이지 않는다.
 * `buildSideStudyListHref` 와 같은 방식이다.
 *
 * `today` 를 인자로 받는 것은 기본값 비교에만 쓰기 때문이다. 서버에서 그린 링크와 브라우저가
 * 하이드레이션할 때의 링크는 자정을 사이에 두면 `?date=` 유무가 갈릴 수 있지만, 어느 쪽이든
 * 같은 날을 가리키는 링크다.
 */
export function buildJobCalendarHref(
  base: JobCalendarQuery,
  overrides: Partial<JobCalendarQuery> = {},
  today: Date = new Date(),
): string {
  const merged: JobCalendarQuery = { ...base, ...overrides };
  const params = new URLSearchParams();

  if (!isSameDay(merged.date, today)) {
    params.set('date', toCalendarParam(merged.date));
  }
  if (merged.brief) {
    params.set('brief', BRIEF_ON);
  }

  const query = params.toString();
  return query ? `/calendar?${query}` : '/calendar';
}
