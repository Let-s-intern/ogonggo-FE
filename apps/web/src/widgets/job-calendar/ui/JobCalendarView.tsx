import { getJobCalendar } from '@ogonggo/api';
import { toCalendarParam } from '../lib/query';
import { CALENDAR_FIRST_DAY, startOfCalendarWeek } from '../lib/week';
import { MonthGrid } from './MonthGrid';
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
 * `getJobCalendar`(packages/api/src/generated/user/endpoints.ts)의 선언 타입은
 * `widgets/job-detail/ui/JobDetailView.tsx`와 같은 이유로 `{ data, status, headers }`로 감싼
 * 응답을 가정하지만, 이 저장소의 `httpClient`는 파싱된 body 를 그대로 반환한다.
 */
async function fetchCalendarItems(
  from: string,
  to: string,
): Promise<UserJobCalendarItemResponse[]> {
  const response = (await getJobCalendar({
    from,
    to,
  })) as unknown as SuccessResponseListUserJobCalendarItemResponse;

  return response.data ?? [];
}

export interface JobCalendarViewProps {
  /** 어느 달을 펼칠지. `?date=` 가 정하고, 없으면 오늘이다(`../lib/query`). */
  baseDate?: Date;
  /** `간략히 보기`. 켜면 주간, 끄면 월간이다(PRD 8.1). */
  brief?: boolean;
}

/**
 * 공고 달력의 데이터 담당. **서버 컴포넌트다** — 달력 항목을 여기서 받아 props 로 내려주고
 * 브라우저는 `/api/v1/jobs/calendar` 를 부르지 않는다(PRD 6.1, AC 10).
 *
 * 격자에 그리는 일은 `CalendarGrid`(클라이언트 컴포넌트)가 한다.
 */
export async function JobCalendarView({
  baseDate = new Date(),
  brief = false,
}: JobCalendarViewProps) {
  const { from, to } = brief ? weekGridRange(baseDate) : monthGridRange(baseDate);
  const items = await fetchCalendarItems(toCalendarParam(from), toCalendarParam(to));

  const initialDate = toCalendarParam(baseDate);

  // 뷰를 컴포넌트 통째로 갈아끼운다(2026-09-02 결정). 한 인스턴스에서 `changeView()` 를 부르는
  // 방법도 되지만, `initialDate`/`initialView` 처럼 마운트 때만 읽히는 값을 명령형 API 로
  // 따라가게 하는 자리가 하나 더 늘어난다. 어차피 조회 범위가 7일과 42일로 달라 토글하면
  // 서버가 다시 렌더하므로 리마운트가 추가 비용도 아니다. 두 뷰의 렌더 규칙이 서로 겹치지
  // 않는다는 점이 더 크다 — 로고와 `+N` 은 월간, 가로 막대는 주간이다.
  return brief ? (
    <WeekGrid items={items} initialDate={initialDate} />
  ) : (
    <MonthGrid items={items} initialDate={initialDate} />
  );
}
