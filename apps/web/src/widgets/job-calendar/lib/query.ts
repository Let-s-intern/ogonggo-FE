import {
  ListPublicJobCalendarEmploymentType,
  ListPublicJobCalendarExperienceType,
} from '@ogonggo/api';
import { isJobMajorSlug, MAX_JOB_MAJORS } from './job-majors';

/** 달력 필터 줄의 `채용 형태`. 서버가 한 번에 하나만 받는다(`ListPublicJobCalendarParams`). */
export type JobCalendarEmploymentType = ListPublicJobCalendarEmploymentType;

/** 달력 필터 줄의 `경력`. 마찬가지로 하나만 받는다. */
export type JobCalendarExperienceType = ListPublicJobCalendarExperienceType;

/**
 * `/calendar` 이 URL 쿼리에 두는 상태(`?date=2026-08-19&brief=1`). 앞선 화면들의 탭·페이지네이션과
 * 같은 방식이고(`widgets/side-study-list/lib/query.ts`), 새로고침과 뒤로가기가 그대로 동작한다
 * (PRD 7절).
 *
 * `brief`(`간략히 보기`)는 주간 뷰 여부다(PRD 8.1). 값을 읽고 쓰는 자리는 여기가 전부이고,
 * 실제로 뷰를 갈아끼우는 것은 Push 3 이다.
 *
 * `majors`와 `picker`는 v6(`docs/asset/v6 공고달력/`)의 관심 직무 선택이다. 고른 직무는
 * `?majors=it,design`, 선택 화면이 열려 있는지는 `?picker=1`이다.
 *
 * `employmentType`·`experienceType` 은 필터 줄의 알약 둘이다. **직무와 같은 자리에 둔다** —
 * 값은 주소에 싣고 서버 컴포넌트가 읽어 달력 요청의 파라미터로 넘긴다. 직무처럼 여럿을 고를 수
 * 없는 것은 서버가 값 하나만 받기 때문이고, 알약도 목업에서 하나만 고르는 드롭다운이다.
 */
export interface JobCalendarQuery {
  /** 달력이 펼칠 기준 날짜. `?date=` 가 없거나 읽을 수 없으면 오늘이다. */
  date: Date;
  /** 켜면 주간, 끄면 월간. 기본은 월간이다(PRD 8.1). */
  brief: boolean;
  /** 고른 관심 직무의 `slug`(`./job-majors`). 최대 3개, 모르는 값은 버린다. */
  majors: string[];
  /** 관심 직무 선택 화면이 달력 자리에 열려 있는지. */
  picker: boolean;
  /** `채용 형태` 알약. 고르지 않았으면 없고, 그때는 파라미터를 보내지 않는다. */
  employmentType?: JobCalendarEmploymentType;
  /** `경력` 알약. 같은 규칙이다. */
  experienceType?: JobCalendarExperienceType;
  /** `마감공고 제외` 체크박스. **기본은 꺼짐이다** — 켜야 줄어든다. */
  excludeClosed: boolean;
  /** `공고 검색` 알약. 두 글자 미만이면 없는 것으로 읽는다. */
  keyword?: string;
}

export interface JobCalendarSearchParams {
  date?: string;
  brief?: string;
  majors?: string;
  picker?: string;
  employmentType?: string;
  experienceType?: string;
  excludeClosed?: string;
  keyword?: string;
}

/** 켜짐을 나타내는 유일한 값. 그 밖의 값은 전부 꺼짐이다. */
const FLAG_ON = '1';

/**
 * 검색어 길이. 서버가 `2` 이상 `100` 이하만 받고, 벗어나면 400 이라 달력 전체가 빈다
 * (`ListPublicJobCalendarParams`). 그래서 **보내기 전에 여기서 거른다.**
 */
export const KEYWORD_MIN_LENGTH = 2;
export const KEYWORD_MAX_LENGTH = 100;

/**
 * 앞뒤 공백을 떼고 길이를 본다. 두 글자가 안 되면 검색어가 없는 것으로 읽는다 — 손으로 고친
 * 주소(`?keyword=a`)가 그대로 서버로 가면 400 이 되고, 필터 하나가 화면 전체를 비운다.
 */
export function parseKeyword(value: string | undefined): string | undefined {
  const trimmed = value?.trim().slice(0, KEYWORD_MAX_LENGTH) ?? '';
  return trimmed.length >= KEYWORD_MIN_LENGTH ? trimmed : undefined;
}

/**
 * 아는 값만 통과시킨다. 주소는 손으로 고칠 수 있고, 모르는 값을 그대로 파라미터로 실어 보내면
 * 서버가 400 을 돌려줘 달력 전체가 빈다 — 그럴 바에는 그 필터를 걸지 않은 것으로 읽는다.
 */
function parseEnumParam<TValue extends string>(
  allowed: Readonly<Record<string, TValue>>,
  value: string | undefined,
): TValue | undefined {
  return value !== undefined && Object.hasOwn(allowed, value) ? allowed[value] : undefined;
}

/**
 * `?majors=` 를 아는 값만, 중복 없이, 최대 개수까지 읽는다. 손으로 고친 URL 에 네 개가
 * 들어와도 선택 화면의 규칙(최대 3개)과 어긋나지 않게 앞에서부터 자른다.
 */
export function parseJobMajors(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  const slugs = value.split(',').filter(isJobMajorSlug);
  return [...new Set(slugs)].slice(0, MAX_JOB_MAJORS);
}

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
    brief: searchParams.brief === FLAG_ON,
    majors: parseJobMajors(searchParams.majors),
    picker: searchParams.picker === FLAG_ON,
    employmentType: parseEnumParam(
      ListPublicJobCalendarEmploymentType,
      searchParams.employmentType,
    ),
    experienceType: parseEnumParam(
      ListPublicJobCalendarExperienceType,
      searchParams.experienceType,
    ),
    excludeClosed: searchParams.excludeClosed === FLAG_ON,
    keyword: parseKeyword(searchParams.keyword),
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
    params.set('brief', FLAG_ON);
  }
  if (merged.majors.length > 0) {
    params.set('majors', merged.majors.join(','));
  }
  if (merged.picker) {
    params.set('picker', FLAG_ON);
  }
  if (merged.employmentType) {
    params.set('employmentType', merged.employmentType);
  }
  if (merged.experienceType) {
    params.set('experienceType', merged.experienceType);
  }
  if (merged.excludeClosed) {
    params.set('excludeClosed', FLAG_ON);
  }
  if (merged.keyword) {
    params.set('keyword', merged.keyword);
  }

  const query = params.toString();
  return query ? `/calendar?${query}` : '/calendar';
}
