/**
 * 오공고 인증 API 중 성공 응답이 스펙에 빠진 것의 타입. 손으로 적는다.
 *
 * 배포 스펙(BE main `3c393ba`) 에 `signInWithLetsCareer`·`reissueAccessToken` 의 200 응답이 없어, orval 이
 * 만든 반환 타입에는 오류 응답만 있다. 코드가 실제로 돌려주는 모양은
 * `ogonggo-BE` 의 `ogonggo-api-user/.../auth/presentation/response/UserAuthResponses.kt` 이고, 봉투는 다른
 * API 와 같은 `SuccessResponse`(`status`, `message`, `data`) 다. 스펙에 응답이 채워져 다시 생성하면 이 파일을
 * 지우고 생성 타입을 쓴다.
 */

interface SuccessResponse<T> {
  status: number;
  message: string;
  data: T;
}

/** `SignInResponse`. `isNewUser` 는 첫 교환에서 오공고 계정이 막 생겼을 때 참이다. */
export type SignInWithLetsCareerBody = SuccessResponse<{
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}>;

/** `AccessTokenResponse`. 리프레시 토큰은 바뀌지 않아 돌려주지 않는다. */
export type ReissueAccessTokenBody = SuccessResponse<{ accessToken: string }>;
