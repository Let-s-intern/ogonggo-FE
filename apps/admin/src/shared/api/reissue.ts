import { reissueAccessToken } from '@ogonggo/api';
import { getAccessToken, getRefreshToken, saveAccessToken } from './accessToken';

/**
 * 401 을 받은 요청을 위해 액세스 토큰을 한 번 재발급한다. 기준은 `apps/business/src/shared/api/reissue.ts` 다.
 * `main.tsx` 가 `setUnauthorizedHandler` 로 등록하고, `true` 를 돌려주면 `httpClient` 가 원 요청을 새 토큰으로 한 번
 * 더 보낸다. `false` 면 401 이 그대로 올라가 `app/providers.tsx` 가 토큰을 지우고 로그인 화면으로 보낸다.
 *
 * 여러 요청이 한꺼번에 401 이어도 재발급은 하나만 나간다. 재발급이 끝난 뒤에 도착한 401 이라도 옛 토큰으로 나갔던
 * 요청이면 다시 재발급하지 않고 그대로 재시도한다.
 *
 * 재발급은 사용자 API(`/api/v1/auth/token`)로 간다. `/api/v1/auth` 는 개발에서는 vite 프록시가, 운영에서는
 * `vercel.json` 이 사용자 API 로 보낸다.
 */

/** 인증 API 자신의 401(틀린 비밀번호, 만료된 리프레시 토큰)은 부른 화면이 다룬다. 재발급 요청도 여기 걸린다. */
const AUTH_API_PREFIX = '/api/v1/auth/';

/** 재발급 성공 응답. 스펙에 성공 응답이 빠져 생성 타입이 오류 응답뿐이라 손으로 둔다(business `authResponses.ts`). */
interface ReissueAccessTokenBody {
  data: { accessToken: string };
}

let pendingReissue: Promise<boolean> | null = null;

export function handleUnauthorized(url: string, sentAccessToken: string | null): Promise<boolean> {
  if (url.startsWith(AUTH_API_PREFIX) || !getRefreshToken()) {
    return Promise.resolve(false);
  }
  if (pendingReissue) {
    return pendingReissue;
  }
  const currentAccessToken = getAccessToken();
  if (currentAccessToken && currentAccessToken !== sentAccessToken) {
    return Promise.resolve(true);
  }
  pendingReissue = reissue().finally(() => {
    pendingReissue = null;
  });
  return pendingReissue;
}

async function reissue(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }
  try {
    const body = (await reissueAccessToken({ refreshToken })) as unknown as ReissueAccessTokenBody;
    saveAccessToken(body.data.accessToken);
    return true;
  } catch {
    // 리프레시 토큰이 무효(401·400)든 서버 사정이든 원 요청의 401 을 올린다. providers.tsx 가 로그인으로 보낸다.
    return false;
  }
}
