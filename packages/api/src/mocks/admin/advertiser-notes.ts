import { http, HttpResponse, type HttpHandler } from 'msw';
import type { AdminAdvertiserNoteRequest } from '../../advertiser-notes';
import { findAdvertiser } from '../fixtures/advertisers';
import { advertiserNoteStore, saveAdvertiserNotes } from '../fixtures/advertiser-notes';
import { notFound, ok } from './paging';

/**
 * 광고주 어드민 메모 핸들러(이슈 #573). 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 의 "어드민 메모".
 *
 * - `GET    /api/v1/admin/advertisers/{advertiserId}/notes` 그 광고주의 메모 전부. 최신(등록 시각)순
 * - `POST   /api/v1/admin/advertisers/{advertiserId}/notes` 등록. 쓴 사람은 서버가 관리자 토큰에서 정한다
 * - `PATCH  /api/v1/admin/advertiser-notes/{noteId}`        보낸 칸만 수정
 * - `DELETE /api/v1/admin/advertiser-notes/{noteId}`        삭제
 *
 * 목은 토큰에서 이름을 읽지 않아 쓴 사람을 늘 `관리자` 로 둔다.
 */

const NESTED_PATH = '*/api/v1/admin/advertisers/:advertiserId/notes';
const PATH = '*/api/v1/admin/advertiser-notes/:noteId';
const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;
const MOCK_AUTHOR = '관리자';

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

function fieldError(key: 'title' | 'content', value: unknown): string | null {
  const max = key === 'title' ? TITLE_MAX_LENGTH : CONTENT_MAX_LENGTH;
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length === 0 || text.length > max ? `${key}: 1~${max}자로 보내 주세요.` : null;
}

const listHandler = http.get(NESTED_PATH, ({ params }) => {
  const advertiserId = readId(params.advertiserId);
  if (!findAdvertiser(advertiserId)) {
    return HttpResponse.json(notFound('광고주를 찾을 수 없습니다.'), { status: 404 });
  }
  const notes = advertiserNoteStore.notes
    .filter((note) => note.advertiserId === advertiserId)
    .sort((a, b) =>
      a.createdAt === b.createdAt ? b.id - a.id : a.createdAt < b.createdAt ? 1 : -1,
    );
  return HttpResponse.json(ok(notes), { status: 200 });
});

const createHandler = http.post(NESTED_PATH, async ({ params, request }) => {
  const advertiserId = readId(params.advertiserId);
  if (!findAdvertiser(advertiserId)) {
    return HttpResponse.json(notFound('광고주를 찾을 수 없습니다.'), { status: 404 });
  }
  const body = (await request
    .json()
    .catch(() => null)) as Partial<AdminAdvertiserNoteRequest> | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const error = fieldError('title', body.title) ?? fieldError('content', body.content);
  if (error) {
    return badRequest(error);
  }
  const now = nowKst();
  const note = {
    id: Math.max(0, ...advertiserNoteStore.notes.map((item) => item.id)) + 1,
    advertiserId,
    title: (body.title as string).trim(),
    content: (body.content as string).trim(),
    authorName: MOCK_AUTHOR,
    createdAt: now,
    updatedAt: now,
  };
  advertiserNoteStore.notes.push(note);
  saveAdvertiserNotes();
  return HttpResponse.json({ ...ok(note), status: 201, message: 'Created' }, { status: 201 });
});

const patchHandler = http.patch(PATH, async ({ params, request }) => {
  const note = advertiserNoteStore.notes.find((item) => item.id === readId(params.noteId));
  if (!note) {
    return HttpResponse.json(notFound('메모를 찾을 수 없습니다.'), { status: 404 });
  }
  const body = (await request
    .json()
    .catch(() => null)) as Partial<AdminAdvertiserNoteRequest> | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const error =
    (body.title === undefined ? null : fieldError('title', body.title)) ??
    (body.content === undefined ? null : fieldError('content', body.content));
  if (error) {
    return badRequest(error);
  }
  Object.assign(note, {
    title: body.title?.trim() ?? note.title,
    content: body.content?.trim() ?? note.content,
    updatedAt: nowKst(),
  });
  saveAdvertiserNotes();
  return HttpResponse.json(ok(note), { status: 200 });
});

const deleteHandler = http.delete(PATH, ({ params }) => {
  const id = readId(params.noteId);
  if (!advertiserNoteStore.notes.some((item) => item.id === id)) {
    return HttpResponse.json(notFound('메모를 찾을 수 없습니다.'), { status: 404 });
  }
  advertiserNoteStore.notes = advertiserNoteStore.notes.filter((item) => item.id !== id);
  saveAdvertiserNotes();
  return HttpResponse.json(ok({ id }), { status: 200 });
});

export const advertiserNoteAdminHandlers: HttpHandler[] = [
  listHandler,
  createHandler,
  patchHandler,
  deleteHandler,
];
