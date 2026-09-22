import { signInWithLetsCareer } from '@ogonggo/api';
import { letsCareerCallbackUri, letsCareerTokenFrom, ssoAuthenticate } from './letscareer';

/**
 * 관리자 로그인의 앞부분. 렛츠커리어 SSO 로 받은 토큰을 오공고 토큰으로 바꾼다.
 *
 * 역할이 ADMIN 인지는 여기서 알 수 없다. 그 확인은 받은 토큰으로 어드민 API 를 한 번 부르는
 * `pages/login/ui/LoginPage.tsx` 의 `checkAdminAccess` 가 한다.
 */

/**
 * 오공고 교환 API 의 성공 응답 타입. 손으로 적는다 — 배포 스펙에 `signInWithLetsCareer` 의 200 응답이 없어
 * 생성 타입에는 오류 응답(401·503) 뿐이다. `apps/web/src/shared/api/authResponses.ts` 와 같은 이유이고,
 * 봉투는 다른 API 와 같은 `SuccessResponse` 다. 스펙이 채워져 다시 생성하면 이 타입을 지운다.
 */
interface SignInWithLetsCareerBody {
  status: number;
  message: string;
  data: { accessToken: string; refreshToken: string; isNewUser: boolean };
}

/**
 * 이메일·비밀번호로 렛츠커리어에 로그인하고 오공고 액세스 토큰을 받는다.
 *
 * 1. 렛츠커리어 `POST /v1/sso/authenticate` — 받은 `redirectUrl` 로 이동하지 않고 토큰만 읽는다
 *    (이유는 `letscareer.ts` 의 `ssoAuthenticate` 주석).
 * 2. 오공고 `POST /api/v1/auth/letscareer` — 렛츠커리어 토큰을 오공고 토큰으로 바꾼다. 렛츠커리어 토큰은
 *    여기서 쓰고 버린다.
 *
 * 리프레시 토큰은 쓰지 않는다. 어드민은 재발급을 만들지 않았다(`accessToken.ts`).
 */
export async function signInWithLetsCareerEmail(credentials: {
  email: string;
  password: string;
}): Promise<string> {
  const { redirectUrl } = await ssoAuthenticate({
    ...credentials,
    redirectUri: letsCareerCallbackUri(),
  });
  const letsCareerAccessToken = letsCareerTokenFrom(redirectUrl);
  if (!letsCareerAccessToken) {
    throw new Error('렛츠커리어 로그인 응답에서 토큰을 읽지 못했습니다.');
  }

  // 선언과 실제가 다른 이유는 위 타입 주석에 있다.
  const body = (await signInWithLetsCareer({
    letsCareerAccessToken,
  })) as unknown as SignInWithLetsCareerBody;
  const accessToken = body.data?.accessToken;
  if (!accessToken) {
    throw new Error('로그인 응답에 accessToken 이 없습니다.');
  }
  return accessToken;
}
