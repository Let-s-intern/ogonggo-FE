import { getJobCalendar } from '@ogonggo/api';
import type {
  SuccessResponseListUserJobCalendarItemResponse,
  UserJobCalendarItemResponse,
} from '@ogonggo/api';

/** 격자의 첫 요일. 목업(`docs/asset/공고달력.png`)이 `MON`~`SUN`이다. */
export const CALENDAR_FIRST_DAY = 1;

/** 월간 격자는 앞뒤 달을 물고 항상 6주다(PRD 5.3). 42일이라 92일 제한 안에 든다(PRD 4절). */
const CALENDAR_GRID_DAYS = 42;

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
 * `getJobCalendar`(packages/api/src/generated/user/endpoints.ts)의 선언 타입은
 * `widgets/job-detail/ui/JobDetailView.tsx`와 같은 이유로 `{ data, status, headers }`로 감싼
 * 응답을 가정하지만, 이 저장소의 `httpClient`는 파싱된 body 를 그대로 반환한다.
 */
async function fetchCalendarItems(from: string, to: string): Promise<UserJobCalendarItemResponse[]> {
  const response = (await getJobCalendar({
    from,
    to,
  })) as unknown as SuccessResponseListUserJobCalendarItemResponse;

  return response.data ?? [];
}

export interface JobCalendarViewProps {
  /** 어느 달을 펼칠지. 날짜 이동 줄은 Push 2 가 붙이므로 지금은 늘 오늘이다. */
  baseDate?: Date;
}

/**
 * 공고 달력의 데이터 담당. **서버 컴포넌트다** — 달력 항목을 여기서 받아 props 로 내려주고
 * 브라우저는 `/api/v1/jobs/calendar` 를 부르지 않는다(PRD 6.1, AC 10).
 *
 * 격자에 그리는 일은 아래로 넘긴다. 지금 목록으로 뱉는 자리는 Push 1 task 2.2 의
 * `CalendarGrid` 가 대신한다.
 */
export async function JobCalendarView({ baseDate = new Date() }: JobCalendarViewProps) {
  const { from, to } = monthGridRange(baseDate);
  const items = await fetchCalendarItems(toCalendarParam(from), toCalendarParam(to));

  return (
    <section className="flex w-full flex-col gap-2">
      <p className="text-sm text-gray-500">
        {toCalendarParam(from)} ~ {toCalendarParam(to)} 마감 {items.length}건
      </p>
      <ul className="flex flex-wrap gap-x-4 text-sm text-gray-900">
        {items.map((item) => (
          <li key={item.id}>
            {item.recruitmentEndAt.slice(0, 10)} {item.companyName}
          </li>
        ))}
      </ul>
    </section>
  );
}
