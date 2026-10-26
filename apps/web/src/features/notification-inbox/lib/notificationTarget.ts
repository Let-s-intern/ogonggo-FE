import type { UserNotificationResponse } from '@ogonggo/api';

/**
 * 알림을 눌렀을 때 갈 곳(PRD "읽음 처리와 이동" 3).
 *
 * - `internal`: 오공고 안의 경로. 화면 안에서 옮긴다.
 * - `external`: 다른 오리진의 `https:` 주소. 새 탭(`noopener`)으로 연다.
 * - `none`: 갈 곳이 없다. 읽음만 처리한다.
 */
export type NotificationTarget =
  | { kind: 'internal'; href: string }
  | { kind: 'external'; href: string }
  | { kind: 'none' };

const NONE: NotificationTarget = { kind: 'none' };

/**
 * 댓글 알림은 글 상세로 간다. `commentId` 위치로는 스크롤하지 않는다 — 댓글이 페이지 단위로 불러와져 첫 페이지에
 * 없을 수 있다.
 *
 * 관리자 알림은 `url` 로 간다. 서버는 `http`·`https` 절대 주소만 받는다. 지금 오리진과 같으면 경로만 떼어 화면 안에서
 * 옮기고, 다른 오리진이면 `https:` 일 때만 새 탭으로 연다. 비었거나 해석되지 않거나 다른 오리진의 `http:` 면 가지 않는다.
 *
 * 지금 오리진을 읽으므로 브라우저에서만 부른다. 알림은 로그인 토큰으로 브라우저에서만 받으므로 서버 렌더에는 오지 않는다.
 */
export function notificationTarget(
  notification: UserNotificationResponse,
  origin: string = window.location.origin,
): NotificationTarget {
  switch (notification.type) {
    case 'CONCERN_COMMENT':
      return notification.postId == null
        ? NONE
        : { kind: 'internal', href: `/concerns/${notification.postId}` };
    case 'SIDE_STUDY_COMMENT_REPLY':
      return notification.postId == null
        ? NONE
        : { kind: 'internal', href: `/side-studies/${notification.postId}` };
    default:
      return urlTarget(notification.url, origin);
  }
}

function urlTarget(url: string | null | undefined, origin: string): NotificationTarget {
  if (!url) {
    return NONE;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NONE;
  }
  if (parsed.origin === origin) {
    return { kind: 'internal', href: `${parsed.pathname}${parsed.search}${parsed.hash}` };
  }
  return parsed.protocol === 'https:' ? { kind: 'external', href: parsed.href } : NONE;
}
