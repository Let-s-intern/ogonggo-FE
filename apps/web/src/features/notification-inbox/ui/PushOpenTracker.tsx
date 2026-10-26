'use client';

import { useEffect } from 'react';
import { isSignedIn } from '@/shared/api/authTokens';
import { useReadNotification } from '../model/useNotifications';

/**
 * 푸시를 눌러 열린 페이지의 주소에 붙는 읽음 처리용 쿼리. 붙이는 쪽은 `public/firebase-messaging-sw.js` 의
 * `clickDestination` 이다 — 워커는 import 를 못 써 이름을 거기에도 적었다. 한쪽을 바꾸면 다른 쪽도 바꾼다.
 */
const PUSH_NOTIFICATION_ID_PARAM = 'push_nid';
const PUSH_BATCH_ID_PARAM = 'push_batch';

/**
 * 화면에는 아무것도 그리지 않는다. 푸시를 눌러 열린 페이지에서 그 알림을 읽음 처리한다(PRD 범위 3의 4). 워커는
 * 로그인 토큰을 읽지 못해 주소에 `push_nid`(개인 알림) 또는 `push_batch`(전체 공지)를 붙여 보내고, 여기서 마운트 때
 * 읽는다. 로그인했을 때만 읽음 요청을 보내고, 로그인 여부와 상관없이 두 쿼리는 주소에서 지운다 — 새로 고침이나 공유로
 * 같은 주소를 다시 열어도 또 보내지 않는다.
 *
 * `useSearchParams` 는 쓰지 않고 `window.location` 을 직접 읽는다. 그것을 부르면 이 컴포넌트가 든 화면 전체가
 * 클라이언트 렌더로 내려간다(`features/concern-comments/ui/ConcernComments.tsx` 주석). 주소는 `history.replaceState`
 * 로 바꾼다 — Next 라우터가 그 호출을 받아 자기 상태와 맞춘다.
 */
export function PushOpenTracker() {
  const read = useReadNotification();

  useEffect(() => {
    const url = new URL(window.location.href);
    const notificationId = url.searchParams.get(PUSH_NOTIFICATION_ID_PARAM);
    const batchId = url.searchParams.get(PUSH_BATCH_ID_PARAM);
    if (notificationId === null && batchId === null) {
      return;
    }

    if (isSignedIn()) {
      const id = Number(notificationId);
      if (batchId) {
        read({ source: 'BROADCAST', batchId, isRead: false });
      } else if (Number.isSafeInteger(id) && id > 0) {
        read({ source: 'PERSONAL', id, isRead: false });
      }
    }

    url.searchParams.delete(PUSH_NOTIFICATION_ID_PARAM);
    url.searchParams.delete(PUSH_BATCH_ID_PARAM);
    window.history.replaceState(null, '', url.href);
  }, [read]);

  return null;
}
