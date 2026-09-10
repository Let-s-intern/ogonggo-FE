import { http, HttpResponse, type HttpHandler } from 'msw';
import { NOTICE_FIXTURES, type Notice } from '../fixtures/admin-notice';
import { notFound, ok } from './paging';

/**
 * 공지사항 핸들러.
 *
 * 쓰기가 일어나는 두 곳 중 하나다. 배열을 실제로 고치고, **상단 고정이 동시에 하나뿐이라는
 * 제약을 목이 검사한다** (PRD "고객 지원 · 공지사항"). 화면이 그 제약을 알아서 지킬 것이라고
 * 믿으면, 백엔드가 생겼을 때 아무도 검사하지 않는 규칙이 된다.
 *
 * 고정을 옮길 때 먼저 걸린 공지를 조용히 풀지 않는다. 응답에 `unpinnedNoticeTitle` 을 실어
 * 화면이 무엇이 풀렸는지 알릴 수 있게 한다.
 */

const notices = NOTICE_FIXTURES;

/** 목록은 페이지를 나누지 않는다. 공지는 수십 건을 넘지 않고, 고정 순서가 한눈에 보여야 한다. */
const listNoticesHandler = http.get('*/api/v1/admin/notices', () => {
  const sorted = [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return HttpResponse.json(ok(sorted), { status: 200 });
});

const getNoticeHandler = http.get('*/api/v1/admin/notices/:noticeId', ({ params }) => {
  const notice = notices.find((fixture) => fixture.id === Number(params.noticeId));
  if (!notice) {
    return HttpResponse.json(notFound('공지를 찾을 수 없습니다.'), { status: 404 });
  }
  return HttpResponse.json(ok(notice), { status: 200 });
});

interface NoticeWriteRequest {
  title: string;
  content: string;
  publicationStartAt: string;
  publicationEndAt?: string;
  pinned: boolean;
  active: boolean;
}

function validate(body: NoticeWriteRequest): string | null {
  if (!body.title?.trim()) {
    return '제목을 입력해 주세요.';
  }
  if (!body.content?.trim()) {
    return '본문을 입력해 주세요.';
  }
  if (!body.publicationStartAt) {
    return '게시 시작일을 입력해 주세요.';
  }
  if (body.publicationEndAt && body.publicationEndAt < body.publicationStartAt) {
    return '게시 종료일이 시작일보다 빠릅니다.';
  }
  return null;
}

/**
 * 고정을 이 공지로 옮긴다. 먼저 고정돼 있던 공지의 제목을 돌려준다 — 없으면 `null`.
 *
 * 고정을 끄는 요청일 때는 아무것도 풀지 않는다.
 */
function movePin(target: Notice, pinned: boolean): string | null {
  if (!pinned) {
    target.pinned = false;
    return null;
  }
  const previous = notices.find((notice) => notice.pinned && notice.id !== target.id);
  if (previous) {
    previous.pinned = false;
  }
  target.pinned = true;
  return previous?.title ?? null;
}

const createNoticeHandler = http.post('*/api/v1/admin/notices', async ({ request }) => {
  const body = (await request.json()) as NoticeWriteRequest;
  const error = validate(body);
  if (error) {
    return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message: error }, { status: 400 });
  }

  const notice: Notice = {
    id: Math.max(0, ...notices.map((entry) => entry.id)) + 1,
    title: body.title.trim(),
    content: body.content.trim(),
    publicationStartAt: body.publicationStartAt,
    publicationEndAt: body.publicationEndAt || undefined,
    pinned: false,
    active: body.active,
    createdAt: new Date().toISOString(),
  };
  notices.push(notice);
  const unpinnedNoticeTitle = movePin(notice, body.pinned);

  return HttpResponse.json(ok({ notice, unpinnedNoticeTitle }), { status: 201 });
});

const updateNoticeHandler = http.put(
  '*/api/v1/admin/notices/:noticeId',
  async ({ params, request }) => {
    const notice = notices.find((fixture) => fixture.id === Number(params.noticeId));
    if (!notice) {
      return HttpResponse.json(notFound('공지를 찾을 수 없습니다.'), { status: 404 });
    }

    const body = (await request.json()) as NoticeWriteRequest;
    const error = validate(body);
    if (error) {
      return HttpResponse.json(
        { status: 400, code: 'BAD_REQUEST', message: error },
        { status: 400 },
      );
    }

    notice.title = body.title.trim();
    notice.content = body.content.trim();
    notice.publicationStartAt = body.publicationStartAt;
    notice.publicationEndAt = body.publicationEndAt || undefined;
    notice.active = body.active;
    const unpinnedNoticeTitle = movePin(notice, body.pinned);

    return HttpResponse.json(ok({ notice, unpinnedNoticeTitle }), { status: 200 });
  },
);

export const noticeHandlers: HttpHandler[] = [
  listNoticesHandler,
  getNoticeHandler,
  createNoticeHandler,
  updateNoticeHandler,
];
