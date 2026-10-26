// 웹 푸시를 받는 서비스 워커. 앱이 닫혀 있거나 백그라운드일 때 FCM 이 보낸 알림을 띄운다.
// 등록과 토큰 발급은 `src/features/push-notification/model/pushToken.ts` 가 한다.
//
// 스크립트 주소는 `public/` 의 정적 파일이라 환경변수를 읽지 못한다. 그래서 페이지가 등록할 때
// Firebase 웹 설정을 쿼리스트링으로 붙여 주고, 여기서 `self.location` 으로 읽는다.
//
// SDK 는 구글 CDN 에서 가져온다. 버전은 `apps/web/package.json` 의 `firebase` 와 맞춘다.
importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js');

// 알림을 눌렀을 때 갈 곳. 알림함의 한 줄과 같은 규칙이다 — 그쪽은
// `src/features/notification-inbox/lib/notificationTarget.ts` 이고, 이 파일은 빌드를 거치지 않아 그것을 import 하지 못해
// 따로 적는다. 한쪽을 바꾸면 다른 쪽도 바꾼다.
//
// - `url` 이 있으면(관리자 알림) 그 주소. 서버는 `http`·`https` 절대 주소만 받는다. 다른 오리진은 관리자가 고른 주소라
//   `https:` 면 그대로 열고, `http:` 이거나 해석되지 않으면 오공고 첫 화면으로 간다.
// - 취준고민 댓글은 `/concerns/{postId}`, 사이드·스터디 답글은 `/side-studies/{postId}`. 댓글 위치로는 스크롤하지 않는다.
// - 그 밖에는 첫 화면.
//
// 오공고 안으로 갈 때는 읽음 처리용 쿼리를 붙인다. 워커는 로그인 토큰(`localStorage`)을 읽지 못해 직접 읽음 요청을 보낼 수
// 없어서, 열린 페이지의 `PushOpenTracker`(`src/features/notification-inbox/ui/PushOpenTracker.tsx`)가 읽고 지운다.
// 개인 알림은 `push_nid`, 전체 공지는 `push_batch` 다. 다른 오리진 주소에는 붙이지 않는다.
function clickDestination(fields) {
  const origin = self.location.origin;
  let target = new URL('/', origin);
  if (fields.url) {
    try {
      const requested = new URL(fields.url);
      if (requested.origin === origin) {
        target = requested;
      } else if (requested.protocol === 'https:') {
        return { href: requested.href, internal: false };
      }
    } catch {
      // 해석되지 않는 주소는 첫 화면으로 간다.
    }
  } else if (fields.type === 'CONCERN_COMMENT' && fields.postId) {
    target = new URL(`/concerns/${encodeURIComponent(fields.postId)}`, origin);
  } else if (fields.type === 'SIDE_STUDY_COMMENT_REPLY' && fields.postId) {
    target = new URL(`/side-studies/${encodeURIComponent(fields.postId)}`, origin);
  }

  if (fields.source === 'BROADCAST' && fields.batchId) {
    target.searchParams.set('push_batch', fields.batchId);
  } else if (fields.notificationId) {
    target.searchParams.set('push_nid', fields.notificationId);
  }
  return { href: target.href, internal: true };
}

// 열린 오공고 창이 있으면 새 창 대신 그 창을 옮긴다. 다른 오리진 주소는 오공고 창을 떠나지 않게 새 창으로 연다.
//
// 이 워커의 범위는 `/firebase-cloud-messaging-push-scope` 라 오공고 페이지를 제어하지 않고, `navigate` 는 제어하는 창에만
// 된다. 그래서 `navigate` 가 거절되면 그 창에 메시지(`ogonggo:push-open`)를 보내 페이지가 스스로 옮기게 한다 — 듣는 쪽도
// `PushOpenTracker`(`src/features/notification-inbox/ui/PushOpenTracker.tsx`)다. 창을 앞으로 가져올 권한은 클릭 직후에만 있어 포커스를 먼저 한다.
async function openDestination(destination) {
  if (destination.internal) {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = windows.find((candidate) => candidate.focused) || windows[0];
    if (client) {
      await client.focus();
      try {
        await client.navigate(destination.href);
      } catch {
        client.postMessage({ type: 'ogonggo:push-open', url: destination.href });
      }
      return;
    }
  }
  await clients.openWindow(destination.href);
}

// SDK 도 같은 이벤트를 듣는데, SDK 는 `fcmOptions.link` 만 열고 `data` 는 보지 않는다. 그 링크가 있으면 SDK 가 열도록
// 비켜서고, 없으면 여기서 연다. SDK 보다 먼저 듣도록 `firebase.messaging()` 을 부르기 전에 건다.
self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {};
  // SDK 가 띄운 알림은 `FCM_MSG.data` 아래에, 페이지가 띄운 알림(포그라운드)은 바로 `data` 에 값이 있다.
  const payload = data.FCM_MSG;
  if (payload && payload.fcmOptions && payload.fcmOptions.link) {
    return;
  }

  event.notification.close();
  event.waitUntil(openDestination(clickDestination(payload ? payload.data || {} : data)));
});

const params = new URL(self.location.href).searchParams;
const config = {
  apiKey: params.get('apiKey'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
};

if (config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
  firebase.initializeApp(config);
  // 알림 페이로드가 있는 메시지는 SDK 가 백그라운드에서 알아서 띄운다. 핸들러를 따로 달지 않는다.
  firebase.messaging();
}
