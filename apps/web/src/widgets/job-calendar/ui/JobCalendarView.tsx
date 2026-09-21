import { listPublicJobCalendar } from '@ogonggo/api';
import { getJobMajor } from '@/entities/job/model/job-major';
import { jobMajorLabel } from '../lib/job-majors';
import { toCalendarParam, type JobCalendarQuery } from '../lib/query';
import { CALENDAR_FIRST_DAY, startOfCalendarWeek } from '../lib/week';
import { CalendarHeader } from './CalendarHeader';
import { JobMajorPicker } from './JobMajorPicker';
import { MonthCalendar } from './MonthCalendar';
import { WeekGrid } from './WeekGrid';
import type {
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
  from: string,
  to: string,
): Promise<UserJobCalendarItemResponse[]> {
  const response = (await listPublicJobCalendar({
    from,
    to,
  })) as unknown as SuccessResponseListUserJobCalendarItemResponse;

  return response.data ?? [];
}

/**
 * 고른 관심 직무로 공고를 거를 때 이 공고를 남길지.
 *
 * **직무를 아는 공고만 거른다.** 백엔드에는 직무 필드가 없고(2026-09-21 ogonggo-BE main 기준),
 * 직무를 아는 곳은 목데이터의 매핑(`entities/job/model/job-major.ts`)뿐이다. 직무를 모르는 공고까지
 * 빼면 실제 백엔드에 붙었을 때 달력이 통째로 비고, 그건 "고른 직무의 공고가 없다"는 틀린 말이
 * 된다. 모르는 공고는 남겨 두고 아는 공고만 고른 직무인지 본다.
 *
 * 서버에서만 부른다. 매핑이 목데이터 전체를 끌고 와서 클라이언트 번들에 넣지 않는다.
 */
function matchesJobMajors(jobId: number, slugs: string[]): boolean {
  if (slugs.length === 0) {
    return true;
  }
  const major = getJobMajor(jobId);
  if (!major) {
    return true;
  }
  return slugs.some((slug) => jobMajorLabel(slug) === major);
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
 * 관심 직무 선택이 열려 있으면(`?picker=1`) 격자 대신 선택 화면을 그리고 달력은 부르지 않는다.
 * 주간이면 요일·날짜 머리글은 남긴다 — 목업(`v6 공고달력/관심직무 선택.png`)이 그렇다.
 */
export async function JobCalendarView({ query }: JobCalendarViewProps) {
  const baseDate = query.date;
  const initialDate = toCalendarParam(baseDate);
  // `key` 는 이 요소가 클라이언트 컴포넌트(`MonthCalendar`)의 prop 으로 넘어갈 때 React 가 요구한다.
  const header = <CalendarHeader key="calendar-header" query={query} />;

  if (query.picker) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        {query.brief ? <WeekGrid items={[]} initialDate={initialDate} /> : null}
        <JobMajorPicker query={query} />
      </div>
    );
  }

  const { from, to } = query.brief ? weekGridRange(baseDate) : monthGridRange(baseDate);
  const items = (await fetchCalendarItems(toCalendarParam(from), toCalendarParam(to))).filter(
    (item) => matchesJobMajors(item.id, query.majors),
  );

  // 뷰를 컴포넌트 통째로 갈아끼운다(2026-09-02 결정). 한 인스턴스에서 `changeView()` 를 부르는
  // 방법도 되지만, `initialDate`/`initialView` 처럼 마운트 때만 읽히는 값을 명령형 API 로
  // 따라가게 하는 자리가 하나 더 늘어난다. 어차피 조회 범위가 7일과 42일로 달라 토글하면
  // 서버가 다시 렌더하므로 리마운트가 추가 비용도 아니다. 두 뷰의 렌더 규칙이 서로 겹치지
  // 않는다는 점이 더 크다 — 로고와 `+N` 은 월간, 가로 막대는 주간이다.
  return query.brief ? (
    <div className="flex flex-col gap-4">
      {header}
      <WeekGrid items={items} initialDate={initialDate} />
    </div>
  ) : (
    <MonthCalendar items={items} initialDate={initialDate} header={header} />
  );
}
