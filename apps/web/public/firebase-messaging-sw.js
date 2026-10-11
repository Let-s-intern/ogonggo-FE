// 웹 푸시를 받는 서비스 워커. 앱이 닫혀 있거나 백그라운드일 때 FCM 이 보낸 알림을 띄운다.
// 등록과 토큰 발급은 `src/features/push-notification/model/pushToken.ts` 가 한다.
//
// 스크립트 주소는 `public/` 의 정적 파일이라 환경변수를 읽지 못한다. 그래서 페이지가 등록할 때
// Firebase 웹 설정을 쿼리스트링으로 붙여 주고, 여기서 `self.location` 으로 읽는다.
//
// SDK 는 구글 CDN 에서 가져온다. 버전은 `apps/web/package.json` 의 `firebase` 와 맞춘다.
importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js');

// 알림을 눌렀을 때 `data.url` 로 간다. SDK 도 같은 이벤트를 듣는데, SDK 는 `fcmOptions.link` 만 열고
// `data` 는 보지 않는다. 그 링크가 있으면 SDK 가 열도록 비켜서고, 없으면 여기서 연다.
// SDK 보다 먼저 듣도록 `firebase.messaging()` 을 부르기 전에 건다.
self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {};
  // SDK 가 띄운 알림은 `FCM_MSG` 아래에, 페이지가 띄운 알림은 바로 `data` 에 값이 있다.
  const payload = data.FCM_MSG || {};
  if (payload.fcmOptions && payload.fcmOptions.link) {
    return;
  }

  const requested = (payload.data && payload.data.url) || data.url || '/';
  // 같은 오리진만 연다. 알림 `data` 는 백엔드가 채우지만, 밖으로 나가는 주소를 그대로 열 이유는 없다.
  const target = new URL(requested, self.location.origin);
  const destination = target.origin === self.location.origin ? target.href : self.location.origin;

  event.notification.close();
  event.waitUntil(clients.openWindow(destination));
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
