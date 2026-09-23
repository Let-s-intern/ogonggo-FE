import { http, HttpResponse, type HttpHandler } from 'msw';
import { NOTICE_FIXTURES, type AdminNotice } from '../fixtures/admin-notice';
import { matches, ok, paginate, readPaging } from './paging';

/**
 * 공지사항 핸들러.
 *
 * 배포된 어드민 스펙(`/api/v1/admin/notices`) 을 그대로 흉내 낸다. 목이 실서버와 다르면 목
 * 모드에서 본 화면이 실서버에서 도는지 알 수 없다 — 예전 목은 게시 기간과 `active` 를 들고
 * 쪽을 나누지 않았고, 상단 고정을 하나로 강제했다. **백엔드는 고정 개수를 제한하지 않는다**
 * (`ogonggo-BE` 의 `Notice.pin`). 그래서 풀린 공지를 알려 주던 `unpinnedNoticeTitle` 도 없다.
 *
 * 쓰기가 일어나는 두 곳 중 하나다. 배열을 실제로 고치고, 삭제는 서버와 같이 소프트 삭제라
 * 같은 id 를 두 번 지워도 성공한다.
 */

const notices = NOTICE_FIXTURES;

const alive = () => notices.filter((notice) => notice.deletedAt === undefined);

const findAlive = (raw: string | readonly string[] | undefined): AdminNotice | undefined =>
  alive().find((notice) => notice.id === Number(raw));

/** 목록은 본문을 싣지 않는다. */
function toSummary(notice: AdminNotice) {
  const { content: _content, deletedAt: _deletedAt, ...summary } = notice;
  return summary;
}

function toDetail(notice: AdminNotice) {
  const { deletedAt: _deletedAt, ...detail } = notice;
  return detail;
}

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

function noticeNotFound() {
  return HttpResponse.json(
    { status: 404, code: 'NOTICE_NOT_FOUND', message: '공지사항을 찾을 수 없습니다.' },
    { status: 404 },
  );
}

/** 백엔드는 본문이 JSON 으로 읽히는지만 본다(`LexicalEditorStateValidator`). */
const isEditorJson = (content: string): boolean => {
  if (!content.trim()) {
    return false;
  }
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
};

/** 고정이 먼저, 그 안에서 최신순. 서버가 정렬해서 주고 화면은 받은 순서를 그대로 그린다. */
const listNoticesHandler = http.get('*/api/v1/admin/notices', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const visibility = url.searchParams.get('visibility') ?? '';
  const pinned = url.searchParams.get('pinned') ?? '';
  const { page, size } = readPaging(url);

  const filtered = alive().filter((notice) => {
    if (keyword && !matches(notice.title, keyword)) {
      return false;
    }
    if (visibility && notice.visibility !== visibility) {
      return false;
    }
    if (pinned && notice.pinned !== (pinned === 'true')) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
  });

  return HttpResponse.json(ok(paginate(sorted.map(toSummary), page, size)), { status: 200 });
});

const getNoticeHandler = http.get('*/api/v1/admin/notices/:noticeId', ({ params }) => {
  const notice = findAlive(params.noticeId);
  return notice ? HttpResponse.json(ok(toDetail(notice)), { status: 200 }) : noticeNotFound();
});

interface CreateNoticeBody {
  title: string;
  content: string;
  pinned: boolean;
  visibility: AdminNotice['visibility'];
}

const createNoticeHandler = http.post('*/api/v1/admin/notices', async ({ request }) => {
  const body = (await request.json()) as CreateNoticeBody;
  if (!body.title?.trim()) {
    return badRequest('제목을 입력해 주세요.');
  }
  if (!isEditorJson(body.content ?? '')) {
    return badRequest('에디터 내용 JSON 형식이 올바르지 않습니다.');
  }

  const now = new Date().toISOString();
  const notice: AdminNotice = {
    id: Math.max(0, ...notices.map((entry) => entry.id)) + 1,
    title: body.title.trim(),
    content: body.content,
    pinned: body.pinned,
    visibility: body.visibility,
    registeredAt: now,
    updatedAt: now,
  };
  notices.push(notice);

  return HttpResponse.json(
    { status: 201, message: 'CREATED', data: toDetail(notice) },
    {
      status: 201,
    },
  );
});

/** 보낸 값만 바꾼다. 제목과 본문은 비울 수 없다. */
const updateNoticeHandler = http.patch(
  '*/api/v1/admin/notices/:noticeId',
  async ({ params, request }) => {
    const notice = findAlive(params.noticeId);
    if (!notice) {
      return noticeNotFound();
    }

    const body = (await request.json()) as Partial<CreateNoticeBody>;
    if (body.title !== undefined && !body.title.trim()) {
      return badRequest('제목을 입력해 주세요.');
    }
    if (body.content !== undefined && !isEditorJson(body.content)) {
      return badRequest('에디터 내용 JSON 형식이 올바르지 않습니다.');
    }

    if (body.title !== undefined) {
      notice.title = body.title.trim();
    }
    if (body.content !== undefined) {
      notice.content = body.content;
    }
    if (body.pinned !== undefined) {
      notice.pinned = body.pinned;
    }
    if (body.visibility !== undefined) {
      notice.visibility = body.visibility;
    }
    notice.updatedAt = new Date().toISOString();

    return HttpResponse.json(ok(toDetail(notice)), { status: 200 });
  },
);

/** 소프트 삭제. 이미 지운 공지를 다시 지워도 성공하고 최초 삭제 일시를 유지한다. */
const deleteNoticeHandler = http.delete('*/api/v1/admin/notices/:noticeId', ({ params }) => {
  const notice = notices.find((entry) => entry.id === Number(params.noticeId));
  if (!notice) {
    return noticeNotFound();
  }
  notice.deletedAt ??= new Date().toISOString();
  return HttpResponse.json(ok(null), { status: 200 });
});

export const noticeHandlers: HttpHandler[] = [
  listNoticesHandler,
  getNoticeHandler,
  createNoticeHandler,
  updateNoticeHandler,
  deleteNoticeHandler,
];
