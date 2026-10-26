/**
 * 앱을 보고 있을 때 푸시가 왔다는 `window` 이벤트. `features/push-notification` 의 `onMessage` 가 내고
 * `features/notification-inbox` 의 `NotificationBell` 이 듣는다 — 미읽음 개수와 목록을 다시 읽는다.
 * 푸시 쪽은 React 밖이라 쿼리 클라이언트를 직접 쓰지 않고, features 끼리는 서로 import 하지 않아 이름을 여기 둔다.
 */
export const PUSH_RECEIVED_EVENT = 'ogonggo:push-received';
