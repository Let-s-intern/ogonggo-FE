/**
 * `sign_up` 을 한 세션(브라우저 탭)에서 한 번만 보내기 위한 표식.
 *
 * 가입이 끝난 직후 이어지는 로그인이 실패하면 사용자는 `/login` 에서 다시 로그인하고, 그때 서버는 아직
 * 오공고 계정이 없어 신규 사용자로 판정해 가입 이벤트를 한 번 더 보낸다. 계정은 하나인데 가입이 둘로 세어진다.
 */
export const SIGN_UP_SENT_KEY = 'ogonggo.analytics.signUpSent';

type MarkerStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * 지금 `sign_up` 을 보내도 되는가. 처음이면 참이고 표식을 남긴다. 저장소를 못 쓰면(`undefined` 이거나
 * 읽고 쓰다 던지면) 중복을 가릴 수 없으므로 참이다 — 가입 한 건을 잃는 것보다 중복이 낫다.
 */
export function claimSignUpEvent(storage: MarkerStorage | undefined): boolean {
  if (!storage) {
    return true;
  }
  try {
    if (storage.getItem(SIGN_UP_SENT_KEY) !== null) {
      return false;
    }
    storage.setItem(SIGN_UP_SENT_KEY, '1');
  } catch {
    // 사생활 보호 모드 등 저장소를 못 쓴다.
  }
  return true;
}
