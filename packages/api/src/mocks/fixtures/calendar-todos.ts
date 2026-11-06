import type { AdminCalendarTodoResponse } from '../../calendar';

/**
 * 어드민 캘린더 할 일 목의 저장소(이슈 #573). 브라우저에서는 `localStorage` 에 적어 새로고침해도 남긴다(어드민 메모 목과 같다).
 */

const STORAGE_KEY = 'ogonggo.mock.admin.calendarTodos';

const SEED: AdminCalendarTodoResponse[] = [
  {
    id: 1,
    title: '12월 홈 상단 배너 소재 받기',
    content: '그로우랩 담당자에게 PC·모바일 두 장 요청.',
    startDate: '2026-11-20',
    endDate: '2026-11-25',
    done: false,
    createdAt: '2026-11-04T14:30:00',
    updatedAt: '2026-11-04T14:30:00',
  },
  {
    id: 2,
    title: '11월 광고 정산',
    content: null,
    startDate: '2026-11-30',
    endDate: '2026-11-30',
    done: false,
    createdAt: '2026-11-04T14:31:00',
    updatedAt: '2026-11-04T14:31:00',
  },
  {
    id: 3,
    title: 'SK telecom 계약서 회신 확인',
    content: null,
    startDate: '2026-11-03',
    endDate: '2026-11-03',
    done: true,
    createdAt: '2026-11-02T09:00:00',
    updatedAt: '2026-11-03T17:10:00',
  },
];

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function load(): AdminCalendarTodoResponse[] {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AdminCalendarTodoResponse[];
    }
  } catch {
    // 깨진 값이면 시드로 시작한다.
  }
  return SEED.map((todo) => ({ ...todo }));
}

export const calendarTodoStore: { todos: AdminCalendarTodoResponse[] } = { todos: load() };

export function saveCalendarTodos(): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(calendarTodoStore.todos));
  } catch {
    // 메모리에는 남는다.
  }
}
