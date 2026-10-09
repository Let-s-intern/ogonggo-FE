import { http, HttpResponse, type HttpHandler, type HttpResponseResolver } from 'msw';
import {
  CONCERN_COMMENT_FIXTURES,
  CONCERN_FIXTURES,
  type ConcernCommentFixture,
  type ConcernFixture,
} from './fixtures/concern';
import {
  MOCK_VIEWER_NICKNAME,
  MOCK_VIEWER_USER_ID,
  minutesAgo,
} from './fixtures/recruitment-post-comment';
import { ConcernSummaryResponseCategory } from '../generated/user/models/concernSummaryResponseCategory';
import { ListPublicConcernsSort } from '../generated/user/models/listPublicConcernsSort';
import { ListPublicPopularConcernsSort } from '../generated/user/models/listPublicPopularConcernsSort';
import type { ConcernAuthorResponse } from '../generated/user/models/concernAuthorResponse';
import type { ConcernCommentResponse } from '../generated/user/models/concernCommentResponse';
import type { ConcernCommentRootResponse } from '../generated/user/models/concernCommentRootResponse';
import type { ConcernDetailResponse } from '../generated/user/models/concernDetailResponse';
import type { ConcernSummaryResponse } from '../generated/user/models/concernSummaryResponse';
import type { CreateConcernCommentRequest } from '../generated/user/models/createConcernCommentRequest';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import type { SaveConcernRequest } from '../generated/user/models/saveConcernRequest';
import type { SuccessResponseConcernDetailResponse } from '../generated/user/models/successResponseConcernDetailResponse';
import type { SuccessResponseCreateConcernCommentResponse } from '../generated/user/models/successResponseCreateConcernCommentResponse';
import type { SuccessResponseCreateConcernResponse } from '../generated/user/models/successResponseCreateConcernResponse';
import type { SuccessResponseListConcernSummaryResponse } from '../generated/user/models/successResponseListConcernSummaryResponse';
import type { SuccessResponsePageResponseConcernCommentResponse } from '../generated/user/models/successResponsePageResponseConcernCommentResponse';
import type { SuccessResponsePageResponseConcernCommentRootResponse } from '../generated/user/models/successResponsePageResponseConcernCommentRootResponse';
import type { SuccessResponsePageResponseConcernSummaryResponse } from '../generated/user/models/successResponsePageResponseConcernSummaryResponse';
import type { SuccessResponseUnit } from '../generated/user/models/successResponseUnit';

/**
 * 사용자 웹 취준고민(`/api/v1/concerns` 아래 전부) 목 핸들러. 규칙은 ogonggo-BE
 * `ConcernController`·`ConcernCommentController` 와 그 서비스에서 옮겼다.
 *
 * 저장소는 메모리다. 작성·수정·삭제·도움돼요가 서버 프로세스(서버 렌더 쪽 MSW) 와 브라우저 워커에
 * **따로** 남고, 다시 띄우면 픽스처로 돌아간다. 그래서 브라우저에서 쓴 글은 서버 렌더가 모른다 —
 * 서버가 그리는 상세에서 그 글을 열면 404 다.
 *
 * 토큰은 검사하지 않는다. `Authorization` 이 실려 오면 목 사용자(`MOCK_VIEWER_USER_ID`) 로 본다
 * (사이드·스터디 댓글 핸들러와 같다).
 *
 * 고민글의 `commentCount`(남은 답변 수) 와 `hasOfficialComment` 는 답변 저장소에서 셈한다.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIST_SIZE = 10;
const MAX_LIST_SIZE = 100;
const DEFAULT_COMMENT_SIZE = 10;
const DEFAULT_REPLY_SIZE = 5;
/** 답변 목록·답글 더보기의 `size` 상한. 스펙(`@maximum 30`) 의 값이다. */
const MAX_COMMENT_SIZE = 30;
/** 답변마다 목록에 같이 실리는 앞쪽 답글 수. 백엔드 `REPLY_PREVIEW_SIZE`. */
const REPLY_PREVIEW_SIZE = 5;
/** 인기 고민은 이 기간 안에 쓴 글에서만 고른다. 백엔드 `POPULAR_PERIOD_DAYS`. */
const POPULAR_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
const POPULAR_LIMIT = 3;
const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;
const COMMENT_MAX_LENGTH = 1000;
const DELETED_COMMENT_CONTENT = '삭제된 댓글입니다';
/** 목 모드에서 새로 쓰는 글·답변이 받는 id. 픽스처 id 와 겹치지 않는다. */
const FIRST_NEW_ID = 10_000;

const INTEGER_PATTERN = /^-?\d+$/;

const concernStore: ConcernFixture[] = CONCERN_FIXTURES.map((concern) => ({ ...concern }));
const commentStore: ConcernCommentFixture[] = CONCERN_COMMENT_FIXTURES.map((comment) => ({
  ...comment,
}));
let nextConcernId = FIRST_NEW_ID;
let nextCommentId = FIRST_NEW_ID;

const errorResponse = (status: number, code: string, message: string) => {
  const body: ErrorResponse = { status, code, message };
  return HttpResponse.json(body, { status });
};

const badRequest = (message: string) => errorResponse(400, 'BAD_REQUEST', message);
const unauthorized = () => errorResponse(401, 'UNAUTHORIZED', '인증이 필요합니다.');
const concernNotFound = () => errorResponse(404, 'CONCERN_NOT_FOUND', '고민글을 찾을 수 없습니다.');
const commentNotFound = () =>
  errorResponse(404, 'CONCERN_COMMENT_NOT_FOUND', '댓글을 찾을 수 없습니다.');

const success = (status: number) => ({ status, message: '요청이 성공했습니다.' });

const viewerOf = (request: Request): number | null =>
  request.headers.get('Authorization') ? MOCK_VIEWER_USER_ID : null;

/** 주소의 숫자 id. 숫자가 아니면 `null` 이고 백엔드는 400 을 준다. */
const readId = (raw: string | readonly string[] | undefined): number | null => {
  const value = String(raw);
  return INTEGER_PATTERN.test(value) ? Number(value) : null;
};

const pageOf = <T>(items: T[], page: number, size: number) => ({
  items: items.slice((page - 1) * size, page * size),
  pageInfo: {
    pageNum: page,
    pageSize: size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
  },
});

/** `page`·`size` 쿼리. 범위를 벗어나면 백엔드 검증 문구와 같은 사유 문자열을 돌려준다. */
const readPaging = (
  searchParams: URLSearchParams,
  defaultSize: number,
  maxSize: number,
): { page: number; size: number } | string => {
  const pageParam = searchParams.get('page') ?? String(DEFAULT_PAGE);
  const sizeParam = searchParams.get('size') ?? String(defaultSize);
  if (!INTEGER_PATTERN.test(pageParam) || Number(pageParam) < 1) {
    return '[page] must be greater than or equal to 1';
  }
  if (!INTEGER_PATTERN.test(sizeParam) || Number(sizeParam) < 1) {
    return '[size] must be greater than or equal to 1';
  }
  if (Number(sizeParam) > maxSize) {
    return `[size] must be less than or equal to ${maxSize}`;
  }
  return { page: Number(pageParam), size: Number(sizeParam) };
};

const isConcernCategory = (value: unknown): value is ConcernFixture['category'] =>
  Object.values(ConcernSummaryResponseCategory).includes(value as ConcernFixture['category']);

/**
 * 백엔드는 프로필이 없는 작성자의 `nickname`·`profileImageUrl` 을 `null` 로 보낸다(Jackson 기본 —
 * `NON_NULL` 설정이 없다). 생성 타입은 둘을 `?: string` 으로만 적어 `null` 을 담지 못한다. 목은
 * 실제 응답 모양을 따라 `null` 을 내보내고, 타입만 한 번 넓혀 건넨다 — 화면이 `undefined` 만
 * 처리하게 짜여도 목에서는 통과해 버리는 것을 막는다.
 */
const toAuthor = (nickname?: string, profileImageUrl?: string): ConcernAuthorResponse =>
  ({
    nickname: nickname ?? null,
    profileImageUrl: profileImageUrl ?? null,
  }) as unknown as ConcernAuthorResponse;

const liveConcerns = () => concernStore.filter((concern) => !concern.deletedAt);

const findLiveConcern = (concernId: number) =>
  liveConcerns().find((concern) => concern.id === concernId);

const rootsOf = (concernId: number) =>
  commentStore.filter(
    (comment) => comment.concernId === concernId && comment.parentId === undefined,
  );

/** 살아 있는 답글, 오래된 순. 삭제된 답글은 백엔드처럼 빼고 센다. */
const liveRepliesOf = (parentId: number) =>
  commentStore
    .filter((comment) => comment.parentId === parentId && !comment.deletedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);

/**
 * 답변 목록에 나오는 부모 댓글, 오래된 순. 삭제된 답변은 살아 있는 답글이 남아 있을 때만 자리를
 * 지킨다(백엔드 `findRootComments`).
 */
const visibleRootsOf = (concernId: number) =>
  rootsOf(concernId)
    .filter((comment) => !comment.deletedAt || liveRepliesOf(comment.id).length > 0)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);

/** 남아 있는 답변 수. 답글은 세지 않고 삭제된 답변도 세지 않는다. */
const commentCountOf = (concernId: number) =>
  rootsOf(concernId).filter((comment) => !comment.deletedAt).length;

/** 삭제되지 않은 운영자 댓글이 하나라도 있는지. 답변이든 답글이든 센다(백엔드 쿼리가 그렇다). */
const hasOfficialCommentOf = (concernId: number) =>
  commentStore.some(
    (comment) => comment.concernId === concernId && comment.official && !comment.deletedAt,
  );

const toSummary = (concern: ConcernFixture): ConcernSummaryResponse => ({
  id: concern.id,
  category: concern.category,
  title: concern.title,
  content: concern.content,
  author: toAuthor(concern.nickname, concern.profileImageUrl),
  createdAt: concern.createdAt,
  viewCount: concern.viewCount,
  commentCount: commentCountOf(concern.id),
  hasOfficialComment: hasOfficialCommentOf(concern.id),
});

const toDetail = (concern: ConcernFixture, viewer: number | null): ConcernDetailResponse => ({
  ...toSummary(concern),
  updatedAt: concern.updatedAt ?? concern.createdAt,
  mine: viewer === concern.userId,
});

const toCommentResponse = (
  comment: ConcernCommentFixture,
  concern: ConcernFixture,
  viewer: number | null,
): ConcernCommentResponse => ({
  id: comment.id,
  parentId: comment.parentId,
  author: toAuthor(comment.nickname, comment.profileImageUrl),
  official: comment.official ?? false,
  concernAuthor: comment.userId === concern.userId,
  content: comment.deletedAt ? DELETED_COMMENT_CONTENT : comment.content,
  deleted: comment.deletedAt !== undefined,
  createdAt: comment.createdAt,
  updatedAt: comment.createdAt,
  mine: viewer === comment.userId,
  likeCount: comment.likeCount,
  liked: viewer !== null && (comment.liked ?? false),
});

/**
 * `listPublicConcerns`(`GET /api/v1/concerns`). `category` 를 보내지 않으면 전체, `sort` 는 최신순
 * 이 기본이다. 조회수·답변 수가 같으면 최신 글(id 큰 쪽) 이 앞이다.
 */
const listConcernsHandler = http.get('*/api/v1/concerns', ({ request }) => {
  const searchParams = new URL(request.url).searchParams;
  const paging = readPaging(searchParams, DEFAULT_LIST_SIZE, MAX_LIST_SIZE);
  if (typeof paging === 'string') {
    return badRequest(paging);
  }
  const category = searchParams.get('category');
  if (category !== null && !isConcernCategory(category)) {
    return badRequest('잘못된 요청입니다.');
  }
  const sort = searchParams.get('sort') ?? ListPublicConcernsSort.LATEST;
  if (!Object.values(ListPublicConcernsSort).includes(sort as ListPublicConcernsSort)) {
    return badRequest('잘못된 요청입니다.');
  }

  const filtered = liveConcerns().filter((concern) => !category || concern.category === category);
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case ListPublicConcernsSort.VIEW_COUNT:
        return b.viewCount - a.viewCount || b.id - a.id;
      case ListPublicConcernsSort.COMMENT_COUNT:
        return commentCountOf(b.id) - commentCountOf(a.id) || b.id - a.id;
      default:
        return b.id - a.id;
    }
  });
  const page = pageOf(sorted, paging.page, paging.size);

  const body: SuccessResponsePageResponseConcernSummaryResponse = {
    ...success(200),
    data: { items: page.items.map(toSummary), pageInfo: page.pageInfo },
  };
  return HttpResponse.json(body, { status: 200 });
});

/**
 * `listPublicPopularConcerns`(`GET /api/v1/concerns/popular`). 최근 7 일 안에 쓴 글에서 `sort` 기준
 * 값이 큰 것을 최대 3 건. 페이지 정보는 없고 배열이다.
 */
const listPopularConcernsHandler = http.get('*/api/v1/concerns/popular', ({ request }) => {
  const sort =
    new URL(request.url).searchParams.get('sort') ?? ListPublicPopularConcernsSort.VIEW_COUNT;
  if (
    !Object.values(ListPublicPopularConcernsSort).includes(sort as ListPublicPopularConcernsSort)
  ) {
    return badRequest('잘못된 요청입니다.');
  }

  const createdFrom = Date.now() - POPULAR_PERIOD_MS;
  const popular = liveConcerns()
    .filter((concern) => new Date(concern.createdAt).getTime() >= createdFrom)
    .sort((a, b) =>
      sort === ListPublicPopularConcernsSort.COMMENT_COUNT
        ? commentCountOf(b.id) - commentCountOf(a.id) || b.id - a.id
        : b.viewCount - a.viewCount || b.id - a.id,
    )
    .slice(0, POPULAR_LIMIT);

  const body: SuccessResponseListConcernSummaryResponse = {
    ...success(200),
    data: popular.map(toSummary),
  };
  return HttpResponse.json(body, { status: 200 });
});

/**
 * `getPublicConcern`(`GET /api/v1/concerns/{concernId}`). 토큰이 있으면 `mine` 이 채워진다.
 * 백엔드는 조회수를 비동기로 올려 이번 응답에는 들어가지 않는다 — 목도 응답을 만든 뒤에 올린다.
 */
const getConcernHandler = http.get('*/api/v1/concerns/:concernId', ({ params, request }) => {
  const concernId = readId(params.concernId);
  if (concernId === null) {
    return badRequest('잘못된 요청입니다.');
  }
  const concern = findLiveConcern(concernId);
  if (!concern) {
    return concernNotFound();
  }

  const body: SuccessResponseConcernDetailResponse = {
    ...success(200),
    data: toDetail(concern, viewerOf(request)),
  };
  concern.viewCount += 1;
  return HttpResponse.json(body, { status: 200 });
});

/** 제목·본문 검증. 비었거나(공백만 포함) 길이를 넘으면 사유 문자열을 돌려준다. */
const validateConcernBody = (body: Partial<SaveConcernRequest>): string | null => {
  if (!isConcernCategory(body.category)) {
    return '[category] 올바른 카테고리가 아닙니다.';
  }
  if (!body.title?.trim() || body.title.length > TITLE_MAX_LENGTH) {
    return `[title] 1자 이상 ${TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }
  if (!body.content?.trim() || body.content.length > CONTENT_MAX_LENGTH) {
    return `[content] 1자 이상 ${CONTENT_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }
  return null;
};

/** `createConcern`(`POST /api/v1/concerns`). 만든 글의 id 를 201 로 준다. */
const createConcernHandler = http.post('*/api/v1/concerns', async ({ request }) => {
  const viewer = viewerOf(request);
  if (viewer === null) {
    return unauthorized();
  }
  const body = (await request.json()) as Partial<SaveConcernRequest>;
  const invalid = validateConcernBody(body);
  if (invalid) {
    return badRequest(invalid);
  }

  const id = nextConcernId++;
  concernStore.push({
    id,
    category: body.category as ConcernFixture['category'],
    title: body.title as string,
    content: body.content as string,
    userId: viewer,
    nickname: MOCK_VIEWER_NICKNAME,
    createdAt: minutesAgo(0),
    viewCount: 0,
  });

  const response: SuccessResponseCreateConcernResponse = { ...success(201), data: { id } };
  return HttpResponse.json(response, { status: 201 });
});

/**
 * `replaceMyConcern`(`PUT /api/v1/concerns/{concernId}`). 카테고리·제목·본문을 모두 받아 바꾼다.
 * 작성자 본인만 되고(403) 지워진 글은 404 다.
 */
const replaceConcernHandler = http.put(
  '*/api/v1/concerns/:concernId',
  async ({ params, request }) => {
    const viewer = viewerOf(request);
    if (viewer === null) {
      return unauthorized();
    }
    const concernId = readId(params.concernId);
    if (concernId === null) {
      return badRequest('잘못된 요청입니다.');
    }
    const body = (await request.json()) as Partial<SaveConcernRequest>;
    const invalid = validateConcernBody(body);
    if (invalid) {
      return badRequest(invalid);
    }
    const concern = findLiveConcern(concernId);
    if (!concern) {
      return concernNotFound();
    }
    if (concern.userId !== viewer) {
      return errorResponse(
        403,
        'CONCERN_PERMISSION_DENIED',
        '고민글을 수정하거나 삭제할 권한이 없습니다.',
      );
    }

    concern.category = body.category as ConcernFixture['category'];
    concern.title = body.title as string;
    concern.content = body.content as string;
    concern.updatedAt = minutesAgo(0);

    const response: SuccessResponseUnit = success(200);
    return HttpResponse.json(response, { status: 200 });
  },
);

/**
 * `deleteMyConcern`(`DELETE /api/v1/concerns/{concernId}`). 이미 지운 내 글을 다시 지워도 200 이다.
 * 남의 글은 지워졌든 아니든 403 이다(백엔드 `ConcernService.delete`).
 */
const deleteConcernHandler = http.delete('*/api/v1/concerns/:concernId', ({ params, request }) => {
  const viewer = viewerOf(request);
  if (viewer === null) {
    return unauthorized();
  }
  const concernId = readId(params.concernId);
  if (concernId === null) {
    return badRequest('잘못된 요청입니다.');
  }
  const concern = concernStore.find((entry) => entry.id === concernId);
  if (!concern) {
    return concernNotFound();
  }
  if (concern.userId !== viewer) {
    return errorResponse(
      403,
      'CONCERN_PERMISSION_DENIED',
      '고민글을 수정하거나 삭제할 권한이 없습니다.',
    );
  }
  concern.deletedAt ??= minutesAgo(0);

  const response: SuccessResponseUnit = success(200);
  return HttpResponse.json(response, { status: 200 });
});

/**
 * `listPublicConcernComments`(`GET .../comments`). 답변은 먼저 쓴 순이고(최신순이 아니다) 답변마다
 * 앞쪽 답글 5 개가 실린다. 삭제된 답변은 남은 답글이 있을 때만 목록에 있고 본문이 바뀐다.
 */
const listCommentsHandler = http.get(
  '*/api/v1/concerns/:concernId/comments',
  ({ params, request }) => {
    const concernId = readId(params.concernId);
    if (concernId === null) {
      return badRequest('잘못된 요청입니다.');
    }
    const concern = findLiveConcern(concernId);
    if (!concern) {
      return concernNotFound();
    }
    const paging = readPaging(
      new URL(request.url).searchParams,
      DEFAULT_COMMENT_SIZE,
      MAX_COMMENT_SIZE,
    );
    if (typeof paging === 'string') {
      return badRequest(paging);
    }
    const viewer = viewerOf(request);
    const page = pageOf(visibleRootsOf(concernId), paging.page, paging.size);

    const toRoot = (comment: ConcernCommentFixture): ConcernCommentRootResponse => {
      const preview = pageOf(liveRepliesOf(comment.id), 1, REPLY_PREVIEW_SIZE);
      return {
        ...toCommentResponse(comment, concern, viewer),
        replies: {
          items: preview.items.map((reply) => toCommentResponse(reply, concern, viewer)),
          pageInfo: preview.pageInfo,
        },
      };
    };

    const body: SuccessResponsePageResponseConcernCommentRootResponse = {
      ...success(200),
      data: { items: page.items.map(toRoot), pageInfo: page.pageInfo },
    };
    return HttpResponse.json(body, { status: 200 });
  },
);

/**
 * `listPublicConcernCommentReplies`(`GET .../comments/{commentId}/replies`). 오래된 순. 삭제된
 * 답변 아래의 답글도 읽을 수 있다(백엔드 `readRoot`).
 */
const listRepliesHandler = http.get(
  '*/api/v1/concerns/:concernId/comments/:commentId/replies',
  ({ params, request }) => {
    const concernId = readId(params.concernId);
    const commentId = readId(params.commentId);
    if (concernId === null || commentId === null) {
      return badRequest('잘못된 요청입니다.');
    }
    const concern = findLiveConcern(concernId);
    if (!concern) {
      return concernNotFound();
    }
    if (!rootsOf(concernId).some((comment) => comment.id === commentId)) {
      return commentNotFound();
    }
    const paging = readPaging(
      new URL(request.url).searchParams,
      DEFAULT_REPLY_SIZE,
      MAX_COMMENT_SIZE,
    );
    if (typeof paging === 'string') {
      return badRequest(paging);
    }
    const viewer = viewerOf(request);
    const page = pageOf(liveRepliesOf(commentId), paging.page, paging.size);

    const body: SuccessResponsePageResponseConcernCommentResponse = {
      ...success(200),
      data: {
        items: page.items.map((reply) => toCommentResponse(reply, concern, viewer)),
        pageInfo: page.pageInfo,
      },
    };
    return HttpResponse.json(body, { status: 200 });
  },
);

/**
 * `createConcernComment`(`POST .../comments`). `parentId` 가 있으면 답글이다. 부모는 살아 있는
 * 답변이어야 하고(404), 답글에 다시 답글은 400 이다. 운영자 표시(`official`)는 백엔드가 관리자
 * 계정일 때만 붙이는데 목 사용자는 관리자가 아니라 붙지 않는다.
 */
const createCommentHandler = http.post(
  '*/api/v1/concerns/:concernId/comments',
  async ({ params, request }) => {
    const viewer = viewerOf(request);
    if (viewer === null) {
      return unauthorized();
    }
    const concernId = readId(params.concernId);
    if (concernId === null) {
      return badRequest('잘못된 요청입니다.');
    }
    const { content, parentId } = (await request.json()) as Partial<CreateConcernCommentRequest>;
    if (!content?.trim() || content.length > COMMENT_MAX_LENGTH) {
      return badRequest(`[content] 1자 이상 ${COMMENT_MAX_LENGTH}자 이하로 입력해 주세요.`);
    }
    if (parentId !== undefined && !(Number.isInteger(parentId) && parentId > 0)) {
      return badRequest('[parentId] must be greater than 0');
    }
    if (!findLiveConcern(concernId)) {
      return concernNotFound();
    }
    if (parentId !== undefined) {
      const parent = commentStore.find(
        (comment) =>
          comment.id === parentId && comment.concernId === concernId && !comment.deletedAt,
      );
      if (!parent) {
        return errorResponse(
          404,
          'CONCERN_COMMENT_PARENT_NOT_FOUND',
          '부모 댓글을 찾을 수 없습니다.',
        );
      }
      if (parent.parentId !== undefined) {
        return errorResponse(
          400,
          'CONCERN_COMMENT_NESTING_NOT_ALLOWED',
          '답글에는 다시 답글을 작성할 수 없습니다.',
        );
      }
    }

    const id = nextCommentId++;
    commentStore.push({
      id,
      concernId,
      parentId,
      userId: viewer,
      nickname: MOCK_VIEWER_NICKNAME,
      content,
      createdAt: minutesAgo(0),
      likeCount: 0,
    });

    const body: SuccessResponseCreateConcernCommentResponse = { ...success(201), data: { id } };
    return HttpResponse.json(body, { status: 201 });
  },
);

/** 지워지지 않은 댓글을 찾는다. 없으면 `undefined` 다(지워진 댓글도 404 다). */
const findLiveComment = (concernId: number, commentId: number) =>
  commentStore.find(
    (comment) => comment.id === commentId && comment.concernId === concernId && !comment.deletedAt,
  );

/**
 * `deleteMyConcernComment`(`DELETE .../comments/{commentId}`). 작성자 본인만 되고(403) 소프트
 * 삭제라 답변의 답글은 남는다. 남은 답글이 없으면 그 답변은 목록에서 사라진다.
 */
const deleteCommentHandler = http.delete(
  '*/api/v1/concerns/:concernId/comments/:commentId',
  ({ params, request }) => {
    const viewer = viewerOf(request);
    if (viewer === null) {
      return unauthorized();
    }
    const concernId = readId(params.concernId);
    const commentId = readId(params.commentId);
    if (concernId === null || commentId === null) {
      return badRequest('잘못된 요청입니다.');
    }
    if (!findLiveConcern(concernId)) {
      return concernNotFound();
    }
    const comment = findLiveComment(concernId, commentId);
    if (!comment) {
      return commentNotFound();
    }
    if (comment.userId !== viewer) {
      return errorResponse(
        403,
        'CONCERN_COMMENT_PERMISSION_DENIED',
        '댓글을 삭제할 권한이 없습니다.',
      );
    }
    comment.deletedAt = minutesAgo(0);

    const response: SuccessResponseUnit = success(200);
    return HttpResponse.json(response, { status: 200 });
  },
);

/** 도움돼요 켜기·끄기. 이미 그 상태에서 다시 보내도 200 이고 한 번으로 센다. */
const setLike =
  (liked: boolean): HttpResponseResolver =>
  ({ params, request }) => {
    const viewer = viewerOf(request);
    if (viewer === null) {
      return unauthorized();
    }
    const concernId = readId(params.concernId);
    const commentId = readId(params.commentId);
    if (concernId === null || commentId === null) {
      return badRequest('잘못된 요청입니다.');
    }
    if (!findLiveConcern(concernId)) {
      return concernNotFound();
    }
    const comment = findLiveComment(concernId, commentId);
    if (!comment) {
      return commentNotFound();
    }
    if (liked && !comment.liked) {
      comment.likeCount += 1;
    }
    if (!liked && comment.liked) {
      comment.likeCount -= 1;
    }
    comment.liked = liked;

    const response: SuccessResponseUnit = success(200);
    return HttpResponse.json(response, { status: 200 });
  };

/** `replaceMyConcernCommentLike`(`PUT .../comments/{commentId}/likes/me`). */
const likeCommentHandler = http.put(
  '*/api/v1/concerns/:concernId/comments/:commentId/likes/me',
  setLike(true),
);

/** `deleteMyConcernCommentLike`(`DELETE .../comments/{commentId}/likes/me`). */
const unlikeCommentHandler = http.delete(
  '*/api/v1/concerns/:concernId/comments/:commentId/likes/me',
  setLike(false),
);

export const userConcernHandlers: HttpHandler[] = [
  listConcernsHandler,
  // `getConcernHandler` 보다 앞이어야 한다 — `*/api/v1/concerns/:concernId` 가 `/concerns/popular` 도 잡는다.
  listPopularConcernsHandler,
  getConcernHandler,
  createConcernHandler,
  replaceConcernHandler,
  deleteConcernHandler,
  listCommentsHandler,
  listRepliesHandler,
  createCommentHandler,
  deleteCommentHandler,
  likeCommentHandler,
  unlikeCommentHandler,
];
