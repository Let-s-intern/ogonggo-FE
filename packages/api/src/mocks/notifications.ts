import { http, HttpResponse, type HttpHandler } from 'msw';
import { CONCERN_FIXTURES } from './fixtures/concern';
import { RECRUITMENT_POST_FIXTURES } from './fixtures/recruitment-post';
import { minutesAgo } from './fixtures/recruitment-post-comment';
import type { ErrorResponse } from '../generated/user/models/errorResponse';
import type { SuccessResponseUnit } from '../generated/user/models/successResponseUnit';
import type { SuccessResponseUserNotificationPageResponse } from '../generated/user/models/successResponseUserNotificationPageResponse';
import type { SuccessResponseUserNotificationUnreadCountResponse } from '../generated/user/models/successResponseUserNotificationUnreadCountResponse';
import type { UserNotificationResponse } from '../generated/user/models/userNotificationResponse';

/**
 * 알림함 목 핸들러(PRD `prd-notifications.md` "목 · 사용자"). 목록·미읽음 개수·읽음 셋.
 *
 * 생성 핸들러는 무작위라 커서가 이어지지 않고 읽음이 개수에 반영되지 않는다. 그래서 손으로 쓴다. 알림 26 건을
 * 메모리에 두고 읽음 요청이 그 상태를 바꾼다. 새로 고치면(워커가 다시 뜨면) 처음으로 돌아간다.
 *
 * 화면 분기를 지나가게 짰다 — 취준고민 댓글 미읽음 둘, 사이드·스터디 답글 미읽음·읽음 하나씩, 관리자 개인 발송,
 * 전체 공지(BROADCAST) 미읽음·읽음 하나씩, 100자 미리보기, 프로필 사진 없는 것. 기본 20건이 넘어 `더 보기` 가 보인다.
 * 글 제목은 사이드·스터디·취준고민 목 글에서 가져와, 눌러서 간 상세가 같은 글이다.
 *
 * 커서는 백엔드처럼 불투명한 문자열이고 여기서는 다음 위치를 담는다. 읽지 못하는 커서는 400 이다.
 * 토큰은 검사하지 않는다(다른 `users/me` 목과 같다).
 */

const MINUTE = 1;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * 관리자 알림의 `url` 오리진. 브라우저 워커는 페이지 안에서 돌아 지금 오리진을 안다 — 같은 오리진이면 화면 안에서
 * 이동하는지 볼 수 있다. 서버(`msw/node`)에서는 운영 주소로 둔다.
 */
const SITE_ORIGIN = globalThis.location?.origin ?? 'https://www.ogonggo.co.kr';

/** 프로필 사진 대신 쓰는 목 이미지. 실제 사진 주소는 목에 둘 곳이 없다. */
const PROFILE_IMAGES = ['/hero/concerns.png', '/hero/side-studies.png', '/hero/jobs.png'];

const concernTitle = (postId: number) =>
  CONCERN_FIXTURES.find((concern) => concern.id === postId)?.title ?? `취준고민 ${postId}`;
const sideStudyTitle = (postId: number) =>
  RECRUITMENT_POST_FIXTURES.find((post) => post.id === postId)?.title ?? `모집글 ${postId}`;

let nextPersonalId = 500;
let nextCommentId = 9000;

interface CommentArgs {
  postId: number;
  actor: string;
  preview: string;
  ago: number;
  isRead?: boolean;
  image?: string | null;
}

const concernComment = ({ postId, actor, preview, ago, isRead = true, image }: CommentArgs) =>
  personal({
    type: 'CONCERN_COMMENT',
    actorNickname: actor,
    actorProfileImageUrl: image === undefined ? PROFILE_IMAGES[postId % 3] : image,
    postTitle: concernTitle(postId),
    preview,
    postId,
    commentId: (nextCommentId += 1),
    isRead,
    createdAt: minutesAgo(ago),
  });

const sideStudyReply = ({ postId, actor, preview, ago, isRead = true, image }: CommentArgs) =>
  personal({
    type: 'SIDE_STUDY_COMMENT_REPLY',
    actorNickname: actor,
    actorProfileImageUrl: image === undefined ? PROFILE_IMAGES[(postId + 1) % 3] : image,
    postTitle: sideStudyTitle(postId),
    preview,
    postId,
    commentId: (nextCommentId += 1),
    isRead,
    createdAt: minutesAgo(ago),
  });

function personal(
  fields: Omit<UserNotificationResponse, 'id' | 'source' | 'sourceId'>,
): UserNotificationResponse {
  nextPersonalId += 1;
  return { ...fields, id: nextPersonalId, source: 'PERSONAL', sourceId: String(nextPersonalId) };
}

function broadcast(
  batchId: string,
  fields: { title: string; preview: string; url: string; ago: number; isRead: boolean },
): UserNotificationResponse {
  return {
    id: null,
    type: 'ADMIN_NOTIFICATION',
    actorNickname: '오공고',
    actorProfileImageUrl: null,
    postTitle: fields.title,
    preview: fields.preview,
    postId: null,
    commentId: null,
    isRead: fields.isRead,
    createdAt: minutesAgo(fields.ago),
    url: fields.url,
    batchId,
    // 화면은 `body` 를 쓰지 않는다(PRD 결정 기록). 백엔드처럼 전문을 실어 두기만 한다.
    body: `${fields.preview}\n\n자세한 내용은 링크에서 확인해 주세요.`,
    sourceId: batchId,
    source: 'BROADCAST',
  };
}

/** 유니코드 100자. 백엔드가 자르는 최대 길이 그대로다. */
const LONG_PREVIEW = Array.from(
  '저도 같은 고민을 했었는데요, 포트폴리오는 프로젝트를 많이 넣기보다 두세 개를 깊게 정리하는 쪽이 면접에서 훨씬 이야기하기 좋았어요. 특히 어떤 문제를 왜 그렇게 풀었는지 적어 두면 질문이 그쪽으로 와서 편했어요.',
)
  .slice(0, 100)
  .join('');

const INITIAL: UserNotificationResponse[] = [
  concernComment({
    postId: 1,
    actor: '김오공',
    preview: LONG_PREVIEW,
    ago: 5 * MINUTE,
    isRead: false,
  }),
  // 같은 시각이면 전체 공지가 먼저다(백엔드 정렬). 아래 정렬이 그 순서를 지킨다.
  broadcast('mock-batch-fair', {
    title: '11월 채용 박람회 일정 안내',
    preview: '11월 둘째 주에 열리는 채용 박람회 일정과 사전 등록 방법을 정리했어요.',
    url: `${SITE_ORIGIN}/notices`,
    ago: 2 * HOUR,
    isRead: false,
  }),
  sideStudyReply({
    postId: 10,
    actor: '이스터디',
    preview: '네 아직 자리 있어요! 오픈채팅으로 연락 주세요.',
    ago: 1 * DAY,
    isRead: false,
  }),
  concernComment({
    postId: 2,
    actor: '정취준',
    preview: 'SQL 은 작은 데이터로 직접 질문을 던져 보는 게 제일 빨리 늘었어요.',
    ago: 1 * DAY + 3 * HOUR,
    isRead: false,
    // 프로필 사진이 없는 작성자.
    image: null,
  }),
  personal({
    type: 'ADMIN_NOTIFICATION',
    actorNickname: '오공고',
    actorProfileImageUrl: null,
    postTitle: '프로필을 완성하고 맞춤 공고를 받아 보세요',
    preview: '희망 직무와 지역을 입력하면 오공고가 매일 맞는 공고를 골라 드려요.',
    postId: null,
    commentId: null,
    isRead: false,
    createdAt: minutesAgo(2 * DAY),
    url: `${SITE_ORIGIN}/mypage/profile`,
  }),
  concernComment({
    postId: 4,
    actor: '박멘토',
    preview: '서류 단계에서는 직무 경험을 숫자로 보여 주는 게 가장 효과적이에요.',
    ago: 3 * DAY,
  }),
  sideStudyReply({
    postId: 8,
    actor: '최프론트',
    preview: '면접 대비 스터디는 매주 토요일 오전에 온라인으로 진행해요.',
    ago: 3 * DAY + 5 * HOUR,
  }),
  broadcast('mock-batch-calendar', {
    title: '공고 달력이 새로워졌어요',
    preview: '마감일 순으로 공고를 한눈에 보고, 관심 공고를 달력에 모아 볼 수 있어요.',
    // 다른 오리진의 https 주소. 알림함은 새 탭으로 연다.
    url: 'https://www.letscareer.co.kr',
    ago: 4 * DAY,
    isRead: true,
  }),
  ...Array.from({ length: 18 }, (_, index) => {
    const ago = 5 * DAY + index * 7 * HOUR;
    return index % 2 === 0
      ? concernComment({
          postId: (index % 6) + 1,
          actor: `취준생${index + 1}`,
          preview: `${index + 1}번째 답변이에요. 저는 공고마다 우대사항을 표로 정리해 두고 지원 순서를 정했어요.`,
          ago,
        })
      : sideStudyReply({
          postId: (index % 10) + 1,
          actor: `팀원${index + 1}`,
          preview: `${index + 1}번째 답글이에요. 일정 맞춰서 다음 모임 때 같이 이야기해요.`,
          ago,
        });
  }),
];

/** 최신순, 같은 시각이면 전체 공지가 먼저. 백엔드가 주는 순서다. */
const store: UserNotificationResponse[] = [...INITIAL].sort((a, b) => {
  if (a.createdAt !== b.createdAt) {
    return a.createdAt < b.createdAt ? 1 : -1;
  }
  return Number(b.source === 'BROADCAST') - Number(a.source === 'BROADCAST');
});

const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;
const CURSOR_PREFIX = 'mock-';

const errorResponse = (status: number, code: string, message: string) => {
  const body: ErrorResponse = { status, code, message };
  return HttpResponse.json(body, { status });
};

const notificationNotFound = () =>
  errorResponse(404, 'USER_NOTIFICATION_NOT_FOUND', '알림을 찾을 수 없습니다.');

const ok = () => {
  const body: SuccessResponseUnit = { status: 200, message: '요청이 성공했습니다.' };
  return HttpResponse.json(body);
};

/** 커서가 가리키는 위치. 읽지 못하거나 범위를 벗어나면 `null`. */
function parseCursor(cursor: string): number | null {
  if (!cursor.startsWith(CURSOR_PREFIX)) {
    return null;
  }
  const offset = Number(cursor.slice(CURSOR_PREFIX.length));
  return Number.isInteger(offset) && offset > 0 && offset <= store.length ? offset : null;
}

/** `listMyNotifications`(`GET /api/v1/users/me/notifications`). */
const listHandler = http.get('*/api/v1/users/me/notifications', ({ request }) => {
  const params = new URL(request.url).searchParams;
  const cursor = params.get('cursor');
  const size = Number(params.get('size') ?? DEFAULT_SIZE);
  if (!Number.isInteger(size) || size < 1 || size > MAX_SIZE) {
    return errorResponse(400, 'BAD_REQUEST', '[size] 1 이상 100 이하여야 합니다.');
  }
  const start = cursor === null ? 0 : parseCursor(cursor);
  if (start === null) {
    return errorResponse(400, 'BAD_REQUEST', '[cursor] 올바르지 않은 커서입니다.');
  }
  const end = start + size;
  const hasNext = end < store.length;
  const body: SuccessResponseUserNotificationPageResponse = {
    status: 200,
    message: '요청이 성공했습니다.',
    data: {
      items: store.slice(start, end).map((item) => ({ ...item })),
      nextCursor: hasNext ? `${CURSOR_PREFIX}${end}` : null,
      hasNext,
    },
  };
  return HttpResponse.json(body);
});

/** `getMyNotificationUnreadCount`(`GET /api/v1/users/me/notifications/unread-count`). */
const unreadCountHandler = http.get('*/api/v1/users/me/notifications/unread-count', () => {
  const body: SuccessResponseUserNotificationUnreadCountResponse = {
    status: 200,
    message: '요청이 성공했습니다.',
    data: { count: store.filter((item) => !item.isRead).length },
  };
  return HttpResponse.json(body);
});

/** `readAllMyNotifications`(`PATCH /api/v1/users/me/notifications/read-all`). */
const readAllHandler = http.patch('*/api/v1/users/me/notifications/read-all', () => {
  for (const item of store) {
    item.isRead = true;
  }
  return ok();
});

/** `readMyBroadcastNotification`(`PATCH .../notifications/broadcasts/{batchId}/read`). 반복 호출도 200. */
const readBroadcastHandler = http.patch(
  '*/api/v1/users/me/notifications/broadcasts/:batchId/read',
  ({ params }) => {
    const item = store.find(
      (notification) =>
        notification.source === 'BROADCAST' && notification.batchId === params.batchId,
    );
    if (!item) {
      return notificationNotFound();
    }
    item.isRead = true;
    return ok();
  },
);

/** `readMyNotification`(`PATCH .../notifications/{notificationId}/read`). 반복 호출도 200. */
const readOneHandler = http.patch(
  '*/api/v1/users/me/notifications/:notificationId/read',
  ({ params }) => {
    const item = store.find(
      (notification) =>
        notification.source === 'PERSONAL' && notification.id === Number(params.notificationId),
    );
    if (!item) {
      return notificationNotFound();
    }
    item.isRead = true;
    return ok();
  },
);

export const userNotificationHandlers: HttpHandler[] = [
  listHandler,
  unreadCountHandler,
  readAllHandler,
  readBroadcastHandler,
  readOneHandler,
];
