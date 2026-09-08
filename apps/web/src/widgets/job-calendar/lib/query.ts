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
  job?: string;
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

/**
 * 상세 모달이 열렸는지는 `?job=<id>` 가 정한다. `date`·`brief` 와 달리 `JobCalendarQuery` 에
 * 넣지 않는다 — 그 둘은 "달력이 무엇을 보여주는가"이고 `job` 은 그 위에 겹쳐 뜬 모달이다.
 * 갈라 두면 `buildJobCalendarHref` 가 만드는 링크(화살표, 미니 달력, 간략히 보기)가 모달을
 * 달고 다니지 않는다 — 모달을 닫는 주소가 곧 그 링크이기도 하다.
 *
 * 숫자가 아닌 값은 모달을 열지 않는다. 숫자이지만 없는 id 는 여기서 거르지 않는다 — 모달
 * 안에서 오류 문구로 처리한다(`JobDetailModal`). 그 둘은 다른 상황이다. 앞은 주소가 망가진
 * 것이고 뒤는 주소는 멀쩡한데 공고가 사라진 것이다.
 */
export function parseJobParam(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

/**
 * 달력 주소에 `?job=` 만 덧붙인다. 보고 있던 날짜와 뷰는 그대로 남으므로 모달을 닫으면
 * 원래 보던 화면으로 돌아온다.
 */
export function withJobParam(calendarHref: string, jobId: number): string {
  return `${calendarHref}${calendarHref.includes('?') ? '&' : '?'}job=${jobId}`;
}
