import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_AD_CALENDAR_PATH,
  ADMIN_CALENDAR_TODOS_PATH,
  type AdminAdCalendarResponse,
  type AdminCalendarTodoRequest,
  type AdminCalendarTodoResponse,
  type UpdateAdminCalendarTodoRequest,
} from '@ogonggo/api/src/calendar';
import { adminDelete, adminGet, adminWrite } from '@/shared/api/adminClient';

export type CalendarTodo = AdminCalendarTodoResponse;
export type CalendarTodoInput = AdminCalendarTodoRequest;
export type AdCalendar = AdminAdCalendarResponse;

/** 달력이 보이는 날짜 범위. KST `YYYY-MM-DD`, `from` 포함·`to` 미포함. */
export interface CalendarRange {
  from: string;
  to: string;
}

/**
 * 어드민 캘린더(이슈 #573). 백엔드가 아직 없어 손으로 적은 타입·주소(`@ogonggo/api/src/calendar`)로 MSW 목을 부른다.
 * 계약은 `.claude/tasks/memos/백엔드-요청-어드민-캘린더-2026-11-06.md`.
 *
 * 달을 넘길 때 앞 달 막대가 사라졌다 다시 생기지 않게 새 범위를 받는 동안 앞 데이터를 둔다(`keepPreviousData`).
 */
export function useCalendarTodos(range: CalendarRange | null) {
  return useQuery({
    queryKey: ['admin', 'calendar-todos', range?.from, range?.to],
    queryFn: () => adminGet<CalendarTodo[]>(ADMIN_CALENDAR_TODOS_PATH, { ...range }),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  });
}

/**
 * 기간이 겹치는 광고 계약·배너·광고 공고. 계약 목록이 광고주별뿐이라 기간으로 모아 읽는 조회를 따로 둔다(백엔드 요청 문서
 * "왜 새 조회가 필요한가"). 배너·광고 공고·계약을 쓰면 이 키도 함께 낡으므로 넉넉히 다시 받는다(`staleTime` 없음).
 */
export function useAdCalendar(range: CalendarRange | null) {
  return useQuery({
    queryKey: ['admin', 'ad-calendar', range?.from, range?.to],
    queryFn: () => adminGet<AdCalendar>(ADMIN_AD_CALENDAR_PATH, { ...range }),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateTodos() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'calendar-todos'] });
}

/** 등록과 수정. 수정도 폼이 모든 칸을 들고 있어 모두 보낸다. */
export function useSaveCalendarTodo(todoId: number | null) {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: (input: CalendarTodoInput) =>
      todoId === null
        ? adminWrite<CalendarTodo>('POST', ADMIN_CALENDAR_TODOS_PATH, input)
        : adminWrite<CalendarTodo>('PATCH', `${ADMIN_CALENDAR_TODOS_PATH}/${todoId}`, input),
    onSuccess: invalidate,
  });
}

/** 몇 칸만 고친다. 완료 토글(`done`)과 달력에서 끌어 옮기기(`startDate`·`endDate`)가 쓴다. */
export function usePatchCalendarTodo() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: UpdateAdminCalendarTodoRequest }) =>
      adminWrite<CalendarTodo>('PATCH', `${ADMIN_CALENDAR_TODOS_PATH}/${id}`, changes),
    onSuccess: invalidate,
  });
}

export function useDeleteCalendarTodo() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: (todoId: number) => adminDelete(`${ADMIN_CALENDAR_TODOS_PATH}/${todoId}`),
    onSuccess: invalidate,
  });
}
