import { listPublicJobCalendar } from '@ogonggo/api';
import { ALL_JOB_MAJOR_SLUGS, jobMajorField } from '../lib/job-majors';
import { toCalendarParam, type JobCalendarQuery } from '../lib/query';
import { CALENDAR_FIRST_DAY, startOfCalendarWeek } from '../lib/week';
import { CalendarHeader } from './CalendarHeader';
import { JobMajorPicker } from './JobMajorPicker';
import { MonthCalendar } from './MonthCalendar';
import { WeekGrid } from './WeekGrid';
import type {
  ListPublicJobCalendarJobField,
  ListPublicJobCalendarParams,
  SuccessResponseListUserJobCalendarItemResponse,
  UserJobCalendarItemResponse,
} from '@ogonggo/api';

/** 월간 격자는 앞뒤 달을 물고 항상 6주다(PRD 5.3). 42일이라 92일 제한 안에 든다(PRD 4절). */
const CALENDAR_GRID_DAYS = 42;

/** 주간 격자는 월요일부터 7일이다(PRD 5.2). 42일보다도 짧으니 92일 제한과는 무관하다. */
const CALENDAR_WEEK_DAYS = 7;

/**
 * 기준 날짜가 든 달의 격자 범위. 시작은 그 달 1일이 든 주의 월요일이고 거기서 6주다.
 * FullCalendar 의 `dayGridMonth`(`fixedWeekCount` 기본값 `true`)가 그리는 범위와 같아야
 * 격자에 있는 날인데 데이터가 없는 칸이 생기지 않는다.
 */
export function monthGridRange(baseDate: Date): { from: Date; to: Date } {
  const firstOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const leadingDays = (firstOfMonth.getDay() - CALENDAR_FIRST_DAY + 7) % 7;
  const from = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1 - leadingDays);
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + CALENDAR_GRID_DAYS - 1);
  return { from, to };
}

/**
 * 기준 날짜가 든 주의 범위. 월요일부터 7일이고 `dayGridWeek` 이 그리는 범위와 같다.
 *
 * 이 범위를 그대로 `from`~`to` 로 보내는 것이 주간 뷰 색 규칙과도 맞는다 — 응답이
 * **마감일이 이 주에 든 공고**만 담으므로(`packages/api/src/mocks/handlers.ts`) 그린 막대는
 * 전부 "이번 주 마감"이고, 그 중 오늘 마감인 것만 파랑이 된다(PRD 8.3).
 */
export function weekGridRange(baseDate: Date): { from: Date; to: Date } {
  const from = startOfCalendarWeek(baseDate);
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + CALENDAR_WEEK_DAYS - 1);
  return { from, to };
}

/**
 * `listPublicJobCalendar`(packages/api/src/generated/user/endpoints.ts)의 선언 타입은
 * `widgets/job-detail/ui/JobDetailView.tsx`와 같은 이유로 `{ data, status, headers }`로 감싼
 * 응답을 가정하지만, 이 저장소의 `httpClient`는 파싱된 body 를 그대로 반환한다.
 */
async function fetchCalendarItems(
  params: ListPublicJobCalendarParams,
): Promise<UserJobCalendarItemResponse[]> {
  const response = (await listPublicJobCalendar(
    params,
  )) as unknown as SuccessResponseListUserJobCalendarItemResponse;

  return response.data ?? [];
}

/** 하나만 골랐으면 그 값, 아니면 `undefined`(서버에 보내지 않는다). */
function onlyValue<TValue>(values: readonly TValue[]): TValue | undefined {
  return values.length === 1 ? values[0] : undefined;
}

/** 고른 것이 없으면(전체) 통과, 있으면 그중 하나여야 통과. */
function matchesAny(selected: readonly string[], value: string): boolean {
  return selected.length === 0 || selected.includes(value);
}

/** 직무 말고 필터 줄이 거는 것들. `from`·`to`·`jobField` 는 부르는 쪽이 정하므로 뺀다. */
type CalendarFilters = Omit<ListPublicJobCalendarParams, 'from' | 'to' | 'jobField' | 'jobRole'>;

/**
 * 고른 관심 직무의 공고를 받는다. `slugs` 는 항상 하나 이상이다 — 비면 달력을 부르지 않고
 * 선택 화면을 그린다.
 *
 * **요청은 언제나 한 번이다.** 백엔드 `jobField` 는 값 하나만 받는다.
 * - 하나를 골랐으면 서버가 거른다(`jobField`).
 * - 여럿이면 `jobField` 없이 받고 여기서 공고의 `jobField` 로 거른다. 전에는 직무마다 요청을 나눠
 *   보내 최대 3개로 막았는데(`.claude/tasks/memos/결정-달력-직무-필터-여러개-2026-09-23.md`), 25개를
 *   다 고를 수 있게 되면서 요청 수가 고른 수만큼 늘지 않게 바꿨다.
 * - 전부면 거르지 않는다. 직군이 비어 있는 공고도 그때만 보인다 — 어느 직무를 고른 것도 아닌데
 *   고른 목록에 끼면 이상하다.
 */
async function fetchCalendarItemsForMajors(
  from: string,
  to: string,
  slugs: string[],
  filters: CalendarFilters,
): Promise<UserJobCalendarItemResponse[]> {
  const fields = new Set(
    slugs
      .map(jobMajorField)
      .filter((field): field is ListPublicJobCalendarJobField => field !== undefined),
  );
  const onlyField = fields.size === 1 ? [...fields][0] : undefined;
  const items = await fetchCalendarItems({ ...filters, from, to, jobField: onlyField });

  if (onlyField !== undefined || fields.size === ALL_JOB_MAJOR_SLUGS.length) {
    return items;
  }
  return items.filter((item) => item.jobField !== undefined && fields.has(item.jobField));
}

export interface JobCalendarViewProps {
  query: JobCalendarQuery;
}

/**
 * 공고 달력의 데이터 담당. **서버 컴포넌트다** — 달력 항목을 여기서 받아 props 로 내려주고
 * 브라우저는 `/api/v1/jobs/calendar` 를 부르지 않는다(PRD 6.1, AC 10).
 *
 * 날짜 이동 줄(`CalendarHeader`)도 여기서 놓는다. 월간은 v6 에서 오른쪽에 날짜별 목록이 붙어
 * 이동 줄이 격자와 같은 왼쪽 열에 들어가고(`MonthCalendar`), 주간은 전과 같이 전체 폭이다.
 *
 * 관심 직무 선택이 열려 있거나(`?picker=1`) **고른 직무가 없으면** 격자 대신 선택 화면을 그리고
 * 달력은 부르지 않는다. 달력은 직무를 고른 뒤에 보인다 — 전체 공고를 한 달력에 놓으면 한 칸에
 * 수십 건이 쌓여 읽을 수 없다(`prd-calendar-major-gate.md`). `?majors=foo` 처럼 아는 slug 가
 * 하나도 없을 때도 파싱 결과가 비므로 여기로 온다.
 *
 * 주간이면 요일·날짜 머리글은 남긴다 — 목업(`v6 공고달력/관심직무 선택.png`)이 그렇다.
 */
export async function JobCalendarView({ query }: JobCalendarViewProps) {
  const baseDate = query.date;
  const initialDate = toCalendarParam(baseDate);
  // `key` 는 이 요소가 클라이언트 컴포넌트(`MonthCalendar`)의 prop 으로 넘어갈 때 React 가 요구한다.
  const header = <CalendarHeader key="calendar-header" query={query} />;

  if (query.picker || query.majors.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        {query.brief ? (
          <WeekGrid
            items={[]}
            initialDate={initialDate}
            bookmarkedOnly={query.bookmarkedOnly}
            dateBasis={query.dateBasis}
          />
        ) : null}
        <JobMajorPicker query={query} />
      </div>
    );
  }

  const { from, to } = query.brief ? weekGridRange(baseDate) : monthGridRange(baseDate);
  const fromParam = toCalendarParam(from);
  const toParam = toCalendarParam(to);
  const fetchedItems = await fetchCalendarItemsForMajors(fromParam, toParam, query.majors, {
    // 하나만 골랐을 때만 서버가 거른다. 여럿이면 빼고 받아 아래에서 거른다 — 서버는 값 하나만 받는다.
    employmentType: onlyValue(query.employmentTypes),
    experienceType: onlyValue(query.experienceTypes),
    // 꺼져 있으면 아예 보내지 않는다. `false` 도 파라미터로는 실리므로(`getListPublicJobCalendarUrl`)
    // 걸지 않은 필터가 주소에 남는다.
    excludeClosed: query.excludeClosed || undefined,
    keyword: query.keyword,
    // `bookmarkedOnly` 는 여기서 보내지 않는다 — 서버 컴포넌트는 로그인 상태를 모른다
    // (`../lib/query.ts`). `query.bookmarkedOnly` 는 아래로 그대로 내려 클라이언트가 거른다.
    //
    // `deadlineOnly` 는 마감일 기준일 때만 켠다(PRD `prd-calendar-date-basis-toggle.md` 1절).
    // 실 BE 의 질의는 모집 기간이 조회 범위와 겹치기만 하면 담아서, 조회 범위 밖에서 마감하는
    // 공고까지 올 수 있다 — 격자는 마감일 칸에만 그리므로(`MonthCalendar`·`WeekGrid`) 그런
    // 항목은 아예 그려지지 않고, 주간 뷰는 그 항목까지 "이번 주 공고 N개"에 세어 수를 부풀린다.
    // `deadlineOnly=true` 로 보내면 서버가 마감일 기준으로 미리 걸러 준다.
    //
    // 시작일 기준일 때 이 옵션을 그대로 켜 두면 시작일이 범위 안인데 마감은 몇 달 뒤인 공고까지
    // 서버가 먼저 걸러 버린다 — 그래서 끈다. 그러면 서버는 모집 기간이 범위와 겹치는 초과집합을
    // 주므로, 아래에서 `recruitmentStartAt` 이 범위 밖인 항목을 한 번 더 거른다.
    deadlineOnly: query.dateBasis === 'deadline',
  });
  const items = fetchedItems.filter((item) => {
    if (query.dateBasis === 'start') {
      const start = item.recruitmentStartAt.slice(0, 10);
      if (start < fromParam || start > toParam) {
        return false;
      }
    }
    return (
      matchesAny(query.employmentTypes, item.employmentType) &&
      matchesAny(query.experienceTypes, item.experienceType)
    );
  });

  // 뷰를 컴포넌트 통째로 갈아끼운다(2026-09-02 결정). 한 인스턴스에서 `changeView()` 를 부르는
  // 방법도 되지만, `initialDate`/`initialView` 처럼 마운트 때만 읽히는 값을 명령형 API 로
  // 따라가게 하는 자리가 하나 더 늘어난다. 어차피 조회 범위가 7일과 42일로 달라 토글하면
  // 서버가 다시 렌더하므로 리마운트가 추가 비용도 아니다. 두 뷰의 렌더 규칙이 서로 겹치지
  // 않는다는 점이 더 크다 — 로고와 `+N` 은 월간, 가로 막대는 주간이다.
  return query.brief ? (
    <div className="flex flex-col gap-4">
      {header}
      <WeekGrid
        items={items}
        initialDate={initialDate}
        bookmarkedOnly={query.bookmarkedOnly}
        dateBasis={query.dateBasis}
      />
    </div>
  ) : (
    <MonthCalendar
      items={items}
      initialDate={initialDate}
      header={header}
      bookmarkedOnly={query.bookmarkedOnly}
      dateBasis={query.dateBasis}
    />
  );
}
