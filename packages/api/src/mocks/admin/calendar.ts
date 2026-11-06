import { http, HttpResponse, type HttpHandler } from 'msw';
import type { AdminAdCalendarResponse, AdminCalendarTodoRequest } from '../../calendar';
import { adContractStore } from '../fixtures/ad-contracts';
import { adPostingStore } from '../fixtures/ad-postings';
import { advertiserSummary } from '../fixtures/advertisers';
import { bannerStore } from '../fixtures/banners';
import { calendarTodoStore, saveCalendarTodos } from '../fixtures/calendar-todos';
import { toAdminAdPostingResponse } from './ad-postings';
import { toAdminBannerResponse } from './banners';
import { notFound, ok } from './paging';

/**
 * 어드민 캘린더 핸들러(이슈 #573). 계약은 `.claude/tasks/memos/백엔드-요청-어드민-캘린더-2026-11-06.md`.
 *
 * - `GET    /api/v1/admin/calendar-todos?from=&to=` 기간이 `[from, to)` 와 겹치는 할 일. 시작일·id 순
 * - `POST   /api/v1/admin/calendar-todos`           등록
 * - `PATCH  /api/v1/admin/calendar-todos/{todoId}`  보낸 칸만 수정
 * - `DELETE /api/v1/admin/calendar-todos/{todoId}`  삭제
 * - `GET    /api/v1/admin/ad-calendar?from=&to=`    기간이 겹치는 광고 계약·배너·광고 공고
 */

const TODOS_PATH = '*/api/v1/admin/calendar-todos';
const AD_CALENDAR_PATH = '*/api/v1/admin/ad-calendar';
const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

function nowKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

function readId(raw: unknown): number {
  const id = Number(raw);
  return Number.isInteger(id) ? id : Number.NaN;
}

/** `from`·`to` 둘 다 날짜여야 하고 `from < to` 여야 한다. */
function readRange(url: string): { from: string; to: string } | string {
  const params = new URL(url).searchParams;
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  if (!DATE.test(from) || !DATE.test(to) || from >= to) {
    return 'from, to: YYYY-MM-DD(KST) 로, from 이 to 보다 앞서게 보내 주세요.';
  }
  return { from, to };
}

/** 합친 결과(등록은 본문 전부, 수정은 저장된 값 위에 보낸 칸)를 본다. 처음 걸린 것 하나만 알린다. */
function validate(todo: AdminCalendarTodoRequest): string | null {
  const title = typeof todo.title === 'string' ? todo.title.trim() : '';
  if (title.length === 0 || title.length > TITLE_MAX_LENGTH) {
    return `title: 1~${TITLE_MAX_LENGTH}자로 보내 주세요.`;
  }
  if (
    todo.content !== null &&
    (typeof todo.content !== 'string' || todo.content.length > CONTENT_MAX_LENGTH)
  ) {
    return `content: null 이거나 ${CONTENT_MAX_LENGTH}자까지 보낼 수 있습니다.`;
  }
  for (const key of ['startDate', 'endDate'] as const) {
    if (typeof todo[key] !== 'string' || !DATE.test(todo[key])) {
      return `${key}: YYYY-MM-DD(KST) 로 보내 주세요.`;
    }
  }
  if (todo.endDate < todo.startDate) {
    return 'endDate: 끝나는 날은 시작일과 같거나 뒤여야 합니다.';
  }
  if (typeof todo.done !== 'boolean') {
    return 'done: 참·거짓 값을 보내 주세요.';
  }
  return null;
}

function normalize(todo: AdminCalendarTodoRequest): AdminCalendarTodoRequest {
  const content = typeof todo.content === 'string' ? todo.content.trim() : '';
  return { ...todo, title: todo.title.trim(), content: content || null };
}

const listTodosHandler = http.get(TODOS_PATH, ({ request }) => {
  const range = readRange(request.url);
  if (typeof range === 'string') {
    return badRequest(range);
  }
  const todos = calendarTodoStore.todos
    .filter((todo) => todo.startDate < range.to && todo.endDate >= range.from)
    .sort((a, b) =>
      a.startDate === b.startDate ? a.id - b.id : a.startDate < b.startDate ? -1 : 1,
    );
  return HttpResponse.json(ok(todos), { status: 200 });
});

const createTodoHandler = http.post(TODOS_PATH, async ({ request }) => {
  const body = (await request.json().catch(() => null)) as AdminCalendarTodoRequest | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const error = validate(body);
  if (error) {
    return badRequest(error);
  }
  const now = nowKst();
  const { title, content, startDate, endDate, done } = normalize(body);
  const todo = {
    id: Math.max(0, ...calendarTodoStore.todos.map((item) => item.id)) + 1,
    title,
    content,
    startDate,
    endDate,
    done,
    createdAt: now,
    updatedAt: now,
  };
  calendarTodoStore.todos.push(todo);
  saveCalendarTodos();
  return HttpResponse.json({ ...ok(todo), status: 201, message: 'Created' }, { status: 201 });
});

const patchTodoHandler = http.patch(`${TODOS_PATH}/:todoId`, async ({ params, request }) => {
  const todo = calendarTodoStore.todos.find((item) => item.id === readId(params.todoId));
  if (!todo) {
    return HttpResponse.json(notFound('할 일을 찾을 수 없습니다.'), { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as Partial<AdminCalendarTodoRequest> | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const merged: AdminCalendarTodoRequest = {
    title: body.title ?? todo.title,
    content: body.content === undefined ? todo.content : body.content,
    startDate: body.startDate ?? todo.startDate,
    endDate: body.endDate ?? todo.endDate,
    done: body.done ?? todo.done,
  };
  const error = validate(merged);
  if (error) {
    return badRequest(error);
  }
  Object.assign(todo, normalize(merged), { updatedAt: nowKst() });
  saveCalendarTodos();
  return HttpResponse.json(ok(todo), { status: 200 });
});

const deleteTodoHandler = http.delete(`${TODOS_PATH}/:todoId`, ({ params }) => {
  const id = readId(params.todoId);
  if (!calendarTodoStore.todos.some((item) => item.id === id)) {
    return HttpResponse.json(notFound('할 일을 찾을 수 없습니다.'), { status: 404 });
  }
  calendarTodoStore.todos = calendarTodoStore.todos.filter((item) => item.id !== id);
  saveCalendarTodos();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

/** 기간 `[startAt, endAt)`(KST 시각, `null` 은 열린 끝)이 날짜 범위 `[from, to)` 와 겹치는가. */
function overlaps(startAt: string | null, endAt: string | null, from: string, to: string) {
  return (
    (startAt === null || startAt < `${to}T00:00:00`) &&
    (endAt === null || endAt > `${from}T00:00:00`)
  );
}

const adCalendarHandler = http.get(AD_CALENDAR_PATH, ({ request }) => {
  const range = readRange(request.url);
  if (typeof range === 'string') {
    return badRequest(range);
  }
  const { from, to } = range;
  const body: AdminAdCalendarResponse = {
    contracts: adContractStore.contracts
      .filter((contract) => overlaps(contract.startAt, contract.endAt, from, to))
      .map((contract) => ({
        id: contract.id,
        name: contract.name,
        startAt: contract.startAt,
        endAt: contract.endAt,
        advertiserId: contract.advertiserId,
        advertiser: advertiserSummary(contract.advertiserId),
        amount: contract.amount,
        paid: contract.paid,
        products: contract.products,
      })),
    banners: bannerStore.banners
      .filter((banner) => overlaps(banner.startAt, banner.endAt, from, to))
      .map(toAdminBannerResponse),
    adPostings: adPostingStore.adPostings
      .filter((ad) => overlaps(ad.startAt, ad.endAt, from, to))
      .map(toAdminAdPostingResponse),
  };
  return HttpResponse.json(ok(body), { status: 200 });
});

export const calendarAdminHandlers: HttpHandler[] = [
  listTodosHandler,
  createTodoHandler,
  patchTodoHandler,
  deleteTodoHandler,
  adCalendarHandler,
];
