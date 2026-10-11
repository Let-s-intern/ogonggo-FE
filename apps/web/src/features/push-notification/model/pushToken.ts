import { replaceMyFcmToken } from '@ogonggo/api';

/**
 * 웹 푸시(FCM). 브라우저의 알림 권한을 받고, FCM 토큰을 발급해 백엔드에 저장한다
 * (`PUT /api/v1/users/me/fcm-token`). 토큰은 사용자당 하나다 — 저장하면 앞의 기기 토큰은 밀려난다.
 *
 * **Firebase 웹 설정이 하나라도 비어 있으면 이 기능은 없는 것과 같다.** 토글도 그리지 않고 요청도
 * 보내지 않는다(`isPushAvailable`). 값은 `NEXT_PUBLIC_FIREBASE_*` 이고 `.env.example` 에 있다.
 *
 * Firebase SDK 는 쓸 때만 동적으로 불러온다. 이 모듈은 앱 전체에서 마운트되는 `PushTokenSync` 가
 * 지나가므로, 정적으로 가져오면 알림과 상관없는 모든 화면의 번들에 실린다.
 */

const SERVICE_WORKER_PATH = '/firebase-messaging-sw.js';
/**
 * Firebase 의 기본 범위다. `/` 로 두면 안 된다 — 목데이터 모드의 MSW 가 `/` 범위에 워커를 등록하고,
 * 같은 범위에는 하나만 둘 수 있어 뒤에 등록한 쪽이 앞의 것을 밀어낸다.
 */
const SERVICE_WORKER_SCOPE = '/firebase-cloud-messaging-push-scope';

/** 마지막으로 백엔드에 저장한 토큰. 같은 토큰을 앱을 열 때마다 다시 보내지 않으려고 둔다. */
const SAVED_TOKEN_KEY = 'ogonggo.push.savedToken';
/** 사용자가 이 브라우저에서 알림을 끈 표시. 권한은 그대로 두고 우리 쪽에서만 끈다. */
const DISABLED_KEY = 'ogonggo.push.disabled';

interface FirebaseWebConfig {
  apiKey: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * `NEXT_PUBLIC_` 값은 Next 가 빌드 때 이 자리의 글자를 값으로 바꿔 넣는다. 그래서 `process.env[name]`
 * 처럼 이름을 변수로 읽지 않고 한 줄씩 적는다.
 */
function readConfig(): { firebase: FirebaseWebConfig; vapidKey: string } | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) {
    return null;
  }
  return { firebase: { apiKey, projectId, messagingSenderId, appId }, vapidKey };
}

function readFlag(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeFlag(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // 저장이 막혔으면 이번 방문 동안만 유효하다. 다음 방문에 토큰을 한 번 더 보낼 뿐이다.
  }
}

/** 설정이 있고 이 브라우저가 웹 푸시를 받을 수 있는지. iOS 는 홈 화면에 설치한 웹 앱에서만 `true` 다. */
export function isPushAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    readConfig() !== null &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** 브라우저에서 알림을 막아 둔 상태. 이 경우 우리 화면에서는 다시 켤 수 없다. */
export function isPushBlocked(): boolean {
  return Notification.permission === 'denied';
}

/** 켜 둔 상태인지. 권한을 줬어도 사용자가 꺼 두었으면 꺼진 것이다. */
export function isPushEnabled(): boolean {
  return Notification.permission === 'granted' && readFlag(DISABLED_KEY) === null;
}

/** 로그아웃하면 저장해 둔 토큰 기록을 버린다. 다음 사람이 로그인하면 같은 토큰도 다시 저장해야 한다. */
export function forgetSavedToken(): void {
  writeFlag(SAVED_TOKEN_KEY, null);
}

/**
 * 서비스 워커가 `active` 가 될 때까지 기다린다. 푸시 구독은 활성 워커가 있어야 만들어진다.
 * 이미 활성이면 바로 돌아온다.
 */
function whenActive(registration: ServiceWorkerRegistration): Promise<void> {
  if (registration.active) {
    return Promise.resolve();
  }
  const worker = registration.installing ?? registration.waiting;
  if (!worker) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        resolve();
      }
    });
  });
}

async function register(config: FirebaseWebConfig): Promise<ServiceWorkerRegistration> {
  // 워커는 정적 파일이라 환경변수를 못 읽는다. 설정을 쿼리스트링으로 실어 보낸다.
  const url = `${SERVICE_WORKER_PATH}?${new URLSearchParams({ ...config })}`;
  const registration = await navigator.serviceWorker.register(url, { scope: SERVICE_WORKER_SCOPE });
  await whenActive(registration);
  return registration;
}

/** 이 페이지가 떠 있는 동안 포그라운드 메시지를 한 번만 듣는다. */
let listening = false;

/**
 * 이 브라우저의 FCM 토큰을 발급한다. 이미 있으면 같은 값을 돌려준다.
 *
 * 앱이 열려 있을 때 온 메시지는 SDK 가 알림을 띄우지 않고 페이지로 넘긴다. 아무것도 안 하면 열어 둔
 * 사이에 온 알림이 사라지므로, 같은 모양의 알림으로 직접 띄운다.
 */
async function issueToken(): Promise<string> {
  const config = readConfig();
  if (!config) {
    throw new Error('Firebase web config is missing');
  }
  const { getApp, getApps, initializeApp } = await import('firebase/app');
  const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

  const app = getApps().length > 0 ? getApp() : initializeApp(config.firebase);
  const registration = await register(config.firebase);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: config.vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) {
    throw new Error('FCM returned an empty token');
  }

  if (!listening) {
    listening = true;
    onMessage(messaging, (message) => {
      const { title, body } = message.notification ?? {};
      if (title) {
        void registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          data: message.data,
        });
      }
    });
  }
  return token;
}

async function saveToken(token: string): Promise<void> {
  await replaceMyFcmToken({ token });
  writeFlag(SAVED_TOKEN_KEY, token);
}

/**
 * 알림을 켠다. **사용자가 누른 직후에 불러야 한다** — 권한 창은 사용자 동작 안에서만 뜨고, Safari 는
 * 그렇지 않으면 아예 막는다. 그래서 `await` 가 되는 첫 일이 권한 요청이다.
 *
 * 돌려주는 값이 `blocked` 이면 사용자가 권한을 거절했거나 이미 막아 둔 상태다. 저장에 실패하면 던지고,
 * 이 경우 다음 방문에 `syncPushToken` 이 다시 시도하지 않도록 꺼진 상태로 되돌려 둔다.
 */
export async function enablePush(): Promise<'enabled' | 'blocked'> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return 'blocked';
  }
  writeFlag(DISABLED_KEY, null);
  try {
    await saveToken(await issueToken());
  } catch (error) {
    writeFlag(DISABLED_KEY, '1');
    throw error;
  }
  return 'enabled';
}

/**
 * 알림을 끈다. 백엔드에 토큰을 지우는 API 가 없어서 서버의 토큰은 남는다. 대신 이 브라우저의 구독을
 * 해지해, 남은 토큰으로 보내도 이 기기에는 닿지 않게 한다.
 */
export async function disablePush(): Promise<void> {
  writeFlag(DISABLED_KEY, '1');
  forgetSavedToken();
  try {
    const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_SCOPE);
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
  } catch {
    // 해지에 실패해도 꺼진 표시는 남아 있어, 이 브라우저는 더 이상 토큰을 보내지 않는다.
  }
}

let syncing: Promise<void> | null = null;

/**
 * 이미 켜 둔 기기의 토큰을 맞춘다. 앱을 열 때와 로그인할 때 부른다.
 *
 * 권한을 새로 묻지 않는다 — 켜는 것은 `enablePush` 만 한다. 토큰은 브라우저가 바꿀 수 있어 매번
 * 발급을 확인하고, 마지막으로 저장한 값과 다를 때만 백엔드에 보낸다. 실패는 조용히 넘긴다. 사용자가
 * 한 일이 아니고, 다음에 앱을 열 때 다시 맞춘다.
 */
export function syncPushToken(): Promise<void> {
  if (!isPushAvailable() || !isPushEnabled()) {
    return Promise.resolve();
  }
  syncing ??= (async () => {
    const token = await issueToken();
    if (token !== readFlag(SAVED_TOKEN_KEY)) {
      await saveToken(token);
    }
  })()
    .catch(() => {})
    .finally(() => {
      syncing = null;
    });
  return syncing;
}
