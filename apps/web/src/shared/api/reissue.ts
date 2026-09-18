import { reissueAccessToken } from '@ogonggo/api';
import type { ReissueAccessTokenBody } from './authResponses';
import { clearTokens, getAccessToken, getRefreshToken, saveAccessToken } from './authTokens';

/**
 * 401 을 받은 요청을 위해 액세스 토큰을 한 번 재발급한다. `providers.tsx` 가 `setUnauthorizedHandler` 로
 * 등록하고, `true` 를 돌려주면 `httpClient` 가 원 요청을 새 토큰으로 한 번 더 보낸다.
 *
 * 여러 요청이 한꺼번에 401 이어도 재발급은 하나만 나간다. 진행 중인 재발급을 모두가 기다린다.
 * 재발급이 끝난 뒤에 도착한 401 이라도 옛 토큰으로 나갔던 요청이면 다시 재발급하지 않고 그대로 재시도한다.
 *
 * 재발급이 실패하면 두 토큰을 지우고 `/login?redirect=<지금 화면>` 으로 보낸다. 리프레시 토큰(14일) 까지
 * 만료됐으면 다시 로그인하는 수밖에 없다.
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
  } catch {
    clearTokens();
    redirectToLogin();
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
