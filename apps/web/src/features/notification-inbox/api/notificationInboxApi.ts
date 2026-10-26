import {
  getGetMyNotificationUnreadCountQueryKey,
  getListMyNotificationsQueryKey,
  getMyNotificationUnreadCount,
  listMyNotifications,
  readAllMyNotifications,
  readMyBroadcastNotification,
  readMyNotification,
  type SuccessResponseUserNotificationPageResponse,
  type SuccessResponseUserNotificationUnreadCountResponse,
  type UserNotificationPageResponse,
  type UserNotificationResponse,
} from '@ogonggo/api';

/** 알림 한 번에 읽는 건수. 서버 기본값과 같다(최대 100). */
export const NOTIFICATION_PAGE_SIZE = 20;

/**
 * 알림 목록 캐시 키. orval 이 만든 키에 크기를 붙인 것이고, 무효화·삭제는 크기 없는 앞부분
 * (`notificationListPrefix`) 으로 한다.
 */
export const notificationListKey = () =>
  getListMyNotificationsQueryKey({ size: NOTIFICATION_PAGE_SIZE });
export const notificationListPrefix = () => getListMyNotificationsQueryKey();
export const unreadCountKey = () => getGetMyNotificationUnreadCountQueryKey();

export type NotificationSource = 'PERSONAL' | 'BROADCAST';

/**
 * 한 건을 가리키는 데 쓰는 값만. 목록의 알림 말고도 푸시를 눌러 온 쿼리(`PushOpenTracker`)에서 만든 값을 넘긴다.
 */
export type NotificationRef = Pick<UserNotificationResponse, 'id' | 'batchId' | 'source'>;

/**
 * 생성 타입의 `source` 는 `string` 이다(백엔드에 `allowableValues` 가 없다, PRD 백엔드 요청 3). 두 값으로 좁히고,
 * 모르는 값은 개인 알림으로 다룬다. 백엔드가 enum 으로 내주면 이 함수는 지운다.
 */
export function notificationSource(notification: NotificationRef): NotificationSource {
  return notification.source === 'BROADCAST' ? 'BROADCAST' : 'PERSONAL';
}

/** 같은 알림인지. 개인 알림은 `id`, 전체 공지는 `batchId` 로 가린다 — 전체 공지의 `id` 는 `null` 이다. */
export function isSameNotification(a: NotificationRef, b: NotificationRef) {
  const source = notificationSource(a);
  if (source !== notificationSource(b)) {
    return false;
  }
  return source === 'BROADCAST' ? a.batchId === b.batchId : a.id === b.id;
}

/**
 * 알림 한 페이지. 커서는 응답의 `nextCursor` 를 그대로 넘긴다.
 *
 * 생성 함수의 반환 타입은 `{ data, status, headers }` 봉투지만 `httpClient` 는 본문을 그대로 돌려준다 — 다른 기능의
 * 호출과 같은 캐스팅이다. 2xx 가 아니면 `HttpError` 로 던진다.
 */
export async function fetchNotificationPage(
  cursor?: string,
): Promise<UserNotificationPageResponse> {
  const response = (await listMyNotifications({
    cursor,
    size: NOTIFICATION_PAGE_SIZE,
  })) as unknown as SuccessResponseUserNotificationPageResponse;
  return response.data ?? { items: [], nextCursor: null, hasNext: false };
}

export async function fetchUnreadCount(): Promise<number> {
  const response =
    (await getMyNotificationUnreadCount()) as unknown as SuccessResponseUserNotificationUnreadCountResponse;
  return response.data?.count ?? 0;
}

/**
 * 한 건 읽음. 전체 공지는 `batchId`, 그 밖에는 `id` 로 보낸다. 보낼 식별자가 없으면 아무것도 하지 않는다.
 * 이미 읽은 알림을 다시 보내도 서버는 200 이다. 30일이 지났거나 없는 알림은 404 다.
 */
export async function markNotificationRead(notification: NotificationRef): Promise<void> {
  if (notificationSource(notification) === 'BROADCAST') {
    if (notification.batchId) {
      await readMyBroadcastNotification(notification.batchId);
    }
    return;
  }
  if (typeof notification.id === 'number') {
    await readMyNotification(notification.id);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  await readAllMyNotifications();
}
