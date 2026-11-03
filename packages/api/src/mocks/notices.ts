import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  USER_NOTICE_FIXTURES,
  type UserNoticeCategory,
  type UserNoticeFixture,
} from './fixtures/user-notice';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import type { PageInfo } from '../generated/user/models/pageInfo';

/**
 * 사용자 공지 목 — 목록과 본문. 공지 카테고리·태그·썸네일·요약(광고 시스템 PRD "공지 작성 시 카테고리")이
 * 백엔드에 생기기 전에 화면을 먼저 그리려고 손으로 쓴다. 요청한 모양은
 * `.claude/tasks/memos/백엔드-요청-광고-시스템-web.md` 에 있고, 여기는 그 요청을 그대로 흉내 낸다.
 *
 * 목록 쿼리는 기존 `page` · `size` 에 셋을 더한다.
 * - `category`: `OGONGGO_UPDATE` · `JOB_NOTE`. 없으면 전체
 * - `keyword`: 제목·요약·본문 글자에 들어 있는 글만. 앞뒤 공백은 지운다
 * - `pinned`: `true` 면 고정 글(공지 홈 `추천`)만
 *
 * 본문 응답에는 같은 카테고리 안의 `previous`(이전 글, 더 오래된 글) · `next`(다음 글, 더 새 글)를 싣는다.
 * 고정 여부와 상관없이 id 순서로 잇는다.
 */

type NoticeSummary = Omit<UserNoticeFixture, 'content'>;

interface NoticeNeighbor {
  id: number;
  title: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 10;
const CATEGORIES: UserNoticeCategory[] = ['OGONGGO_UPDATE', 'JOB_NOTE'];

const toSummary = ({ content: _content, ...summary }: UserNoticeFixture): NoticeSummary => summary;

/** Lexical JSON 에서 글자만 모은다. JSON 이 아니면(평문 공지) 그대로 쓴다. */
function plainText(content: string): string {
  try {
    const texts: string[] = [];
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') {
        return;
      }
      const record = node as { text?: unknown; children?: unknown; root?: unknown };
      if (typeof record.text === 'string') {
        texts.push(record.text);
      }
      if (Array.isArray(record.children)) {
        record.children.forEach(walk);
      }
      walk(record.root);
    };
    walk(JSON.parse(content));
    return texts.join(' ');
  } catch {
    return content;
  }
}

function matchesKeyword(notice: UserNoticeFixture, keyword: string): boolean {
  const haystack = [notice.title, notice.summary ?? '', plainText(notice.content)]
    .join(' ')
    .toLowerCase();
  return haystack.includes(keyword.toLowerCase());
}

const getNoticesHandler = http.get('*/api/v1/announcements', ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? DEFAULT_PAGE);
  const size = Number(url.searchParams.get('size') ?? DEFAULT_SIZE);
  const category = url.searchParams.get('category');
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const pinnedOnly = url.searchParams.get('pinned') === 'true';

  if (category && !CATEGORIES.includes(category as UserNoticeCategory)) {
    const body: ErrorResponse = {
      status: 400,
      code: 'BAD_REQUEST',
      message: '공지 카테고리 값이 올바르지 않습니다.',
    };
    return HttpResponse.json(body, { status: 400 });
  }

  const matched = USER_NOTICE_FIXTURES.filter(
    (notice) =>
      (!category || notice.category === category) &&
      (!pinnedOnly || notice.pinned) &&
      (keyword === '' || matchesKeyword(notice, keyword)),
  );

  const start = (page - 1) * size;
  const pageInfo: PageInfo = {
    pageNum: page,
    pageSize: size,
    totalElements: matched.length,
    totalPages: Math.ceil(matched.length / size),
  };

  return HttpResponse.json(
    {
      status: 200,
      message: '요청이 성공했습니다.',
      data: { items: matched.slice(start, start + size).map(toSummary), pageInfo },
    },
    { status: 200 },
  );
});

/** 404 본문은 운영 응답 그대로다(2026-09-23 확인). */
const getNoticeHandler = http.get('*/api/v1/announcements/:noticeId', ({ params }) => {
  const noticeId = Number(params.noticeId);
  const notice = USER_NOTICE_FIXTURES.find((fixture) => fixture.id === noticeId);

  if (!notice) {
    const body: ErrorResponse = {
      status: 404,
      code: 'ANNOUNCEMENT_NOT_FOUND',
      message: '공지사항을 찾을 수 없습니다.',
    };
    return HttpResponse.json(body, { status: 404 });
  }

  const sameCategory = USER_NOTICE_FIXTURES.filter(
    (fixture) => fixture.category === notice.category,
  ).sort((a, b) => a.id - b.id);
  const index = sameCategory.findIndex((fixture) => fixture.id === notice.id);
  const neighbor = (fixture?: UserNoticeFixture): NoticeNeighbor | null =>
    fixture ? { id: fixture.id, title: fixture.title } : null;

  return HttpResponse.json(
    {
      status: 200,
      message: '요청이 성공했습니다.',
      data: {
        ...notice,
        previous: neighbor(sameCategory[index - 1]),
        next: neighbor(sameCategory[index + 1]),
      },
    },
    { status: 200 },
  );
});

export const userNoticeHandlers: HttpHandler[] = [getNoticesHandler, getNoticeHandler];
