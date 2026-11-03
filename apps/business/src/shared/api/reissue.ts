import { HttpError, reissueAccessToken } from '@ogonggo/api';
import type { ReissueAccessTokenBody } from './authResponses';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasUsableAccessToken,
  saveAccessToken,
} from './authTokens';

/**
 * 401 을 받은 요청을 위해 액세스 토큰을 한 번 재발급한다. `providers.tsx` 가 `setUnauthorizedHandler` 로
 * 등록하고, `true` 를 돌려주면 `httpClient` 가 원 요청을 새 토큰으로 한 번 더 보낸다.
 *
 * 여러 요청이 한꺼번에 401 이어도 재발급은 하나만 나간다. 진행 중인 재발급을 모두가 기다린다.
 * 재발급이 끝난 뒤에 도착한 401 이라도 옛 토큰으로 나갔던 요청이면 다시 재발급하지 않고 그대로 재시도한다.
 *
 * 재발급이 리프레시 토큰이 무효하다는 답(401 `EXPIRED_REFRESH_TOKEN` 등, 400 형식 오류) 으로 실패하면 두 토큰을
 * 지우고 `/login?redirect=<지금 화면>` 으로 보낸다. 리프레시 토큰(14일) 까지 만료됐으면 다시 로그인하는 수밖에 없다.
 * 5xx·네트워크 오류는 서버 사정이라 토큰을 두고 원 요청의 401 만 올린다 — 서버가 잠깐 흔들렸다고 로그인을 버리면
 * 사용자는 이유 없이 로그아웃된다.
 */

/**
 * 인증 API 자신의 401(틀린 비밀번호, 무효한 렛츠커리어 토큰, 만료된 리프레시 토큰) 은 부른 화면이 다룬다.
 * 재발급 요청(`/api/v1/auth/token`) 도 여기 걸린다. 걸리지 않으면 재발급의 401 이 자기 자신을 기다리며 멈춘다.
 */
const AUTH_API_PREFIX = '/api/v1/auth/';

let pendingReissue: Promise<boolean> | null = null;

export async function handleUnauthorized(
  url: string,
  sentAccessToken: string | null,
): Promise<boolean> {
  // 서버 컴포넌트의 요청은 토큰 없이 나가고, 서버에는 재발급할 저장소도 없다.
  if (typeof window === 'undefined' || url.startsWith(AUTH_API_PREFIX)) {
    return false;
  }
  // 로그인하지 않은 상태의 401 은 로그인이 필요하다는 뜻이다. 재발급할 것이 없고, 화면이 다룬다.
  if (!getRefreshToken()) {
    return false;
  }
  if (pendingReissue) {
    return pendingReissue;
  }
  const currentAccessToken = getAccessToken();
  if (currentAccessToken && currentAccessToken !== sentAccessToken) {
    return true;
  }

  return reissueOnce();
}

/**
 * 토큰을 보내야 `mine`·`liked` 가 채워지는 공개 GET(`GET /api/v1/concerns/**` 등) 을 보내기 전에 쓸 수 있는
 * 액세스 토큰을 확보한다. 읽기를 보내는 쪽이 요청 직전에 부른다.
 *
 * 이런 읽기는 토큰이 없거나 만료돼도 401 이 아니라 비로그인 응답(200, `mine=false`) 을 받는다. 그래서 401 에서
 * 재발급하는 `handleUnauthorized` 가 걸리지 않고, 로그인했는데도 새 탭·브라우저 재시작(액세스 토큰은
 * `sessionStorage`) 이나 30분 만료 뒤에는 내 글·내 답변이 남의 것으로 읽힌다. 리프레시 토큰이 있는데 액세스
 * 토큰이 없거나 곧 만료되면 먼저 재발급하고 요청한다. 진행 중인 재발급이 있으면 그것을 기다린다.
 *
 * 재발급이 실패해도 던지지 않는다. 리프레시 토큰이 무효하면 `reissue` 가 로그인 화면으로 보내고, 서버 사정이면
 * 읽기는 비로그인 응답으로라도 그려야 한다. 비로그인(리프레시 토큰 없음) 과 서버에서는 아무것도 하지 않는다.
 */
export async function ensureAccessToken(): Promise<void> {
  if (typeof window === 'undefined' || !getRefreshToken() || hasUsableAccessToken()) {
    return;
  }
  await (pendingReissue ?? reissueOnce());
}

/** 재발급은 하나만 나간다. 401 흐름과 `ensureAccessToken` 이 같은 진행 중인 재발급을 기다린다. */
function reissueOnce(): Promise<boolean> {
  pendingReissue = reissue().finally(() => {
    pendingReissue = null;
  });
  return pendingReissue;
}

async function reissue(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  try {
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다.');
    }
    // 성공 응답이 스펙에 빠져 생성 타입이 오류 응답뿐이다. authResponses.ts 주석에 이유가 있다.
    const body = (await reissueAccessToken({ refreshToken })) as unknown as ReissueAccessTokenBody;
    saveAccessToken(body.data.accessToken);
    return true;
  } catch (error) {
    const refreshRejected =
      !refreshToken ||
      (error instanceof HttpError && (error.status === 401 || error.status === 400));
    if (refreshRejected) {
      clearTokens();
      redirectToLogin();
    }
    return false;
  }
}

function redirectToLogin(): void {
  const { pathname, search } = window.location;
  if (pathname === '/login') {
    return;
  }
  window.location.assign(`/login?redirect=${encodeURIComponent(`${pathname}${search}`)}`);
}
