/**
 * 이 브라우저의 푸시 기록. 마지막으로 백엔드에 저장한 FCM 토큰과 설치 UUID(`deviceId`) 를 둔다.
 *
 * 알림을 켜고 맞추는 일은 `features/push-notification` 이 하지만, 로그아웃(`features/sign-out`) 도 이 기록을
 * 써서 토큰을 해제해야 한다. `features` 끼리는 서로 가져오지 않으므로 기록은 여기에 둔다.
 */

/** 마지막으로 백엔드에 저장한 토큰. 같은 토큰을 앱을 열 때마다 다시 보내지 않으려고 둔다. */
const SAVED_TOKEN_KEY = 'ogonggo.push.savedToken';
/**
 * 이 브라우저의 설치 UUID. 백엔드는 토큰을 기기마다 따로 두고, 같은 기기인지를 이 값으로 가린다. 계정과
 * 상관없는 값이라 로그아웃·계정 전환·알림 끄기에도 지우지 않는다.
 */
const DEVICE_ID_KEY = 'ogonggo.push.deviceId';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 이 브라우저에 저장해 둔 토큰. 없거나 저장소를 못 쓰면 `null` 이다. */
export function getSavedToken(): string | null {
  return read(SAVED_TOKEN_KEY);
}

export function setSavedToken(token: string): void {
  try {
    window.localStorage.setItem(SAVED_TOKEN_KEY, token);
  } catch {
    // 저장이 막혔으면 이번 방문 동안만 유효하다. 다음 방문에 토큰을 한 번 더 보낼 뿐이다.
  }
}

/** 로그아웃하면 저장해 둔 토큰 기록을 버린다. 다음 사람이 로그인하면 같은 토큰도 다시 저장해야 한다. */
export function forgetSavedToken(): void {
  try {
    window.localStorage.removeItem(SAVED_TOKEN_KEY);
  } catch {
    // 저장소를 못 쓰면 지울 기록도 없다.
  }
}

/**
 * 이 브라우저의 설치 UUID. 처음 부를 때 만들어 두고 이후로는 같은 값을 돌려준다.
 *
 * 저장소를 못 쓰면 `undefined` 다. 매번 새로 만들면 백엔드에 기기가 계속 늘어나므로, 차라리 `deviceId` 없이
 * 보내 백엔드가 회원별 기존 자리를 쓰게 한다.
 */
export function getDeviceId(): string | undefined {
  try {
    const saved = window.localStorage.getItem(DEVICE_ID_KEY);
    if (saved) {
      return saved;
    }
    const created = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return undefined;
  }
}
