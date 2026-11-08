/**
 * 성공 응답이 스펙에 빠진 인증 API 의 타입. 손으로 적는다. 기준은 `apps/web/src/shared/api/authResponses.ts`.
 *
 * 배포 스펙에 `reissueAccessToken` 의 200 응답이 없어 orval 이 만든 반환 타입에는 오류 응답만 있다. 코드가 실제로
 * 돌려주는 모양은 `ogonggo-BE` 의 `ogonggo-api-user/.../auth/presentation/response/UserAuthResponses.kt` 의
 * `AccessTokenResponse` 이고, 봉투는 다른 API 와 같은 `SuccessResponse` 다. 스펙이 채워져 다시 생성하면 지운다.
 */
interface SuccessResponse<T> {
  status: number;
  message: string;
  data: T;
}

/** 리프레시 토큰은 바뀌지 않아 돌려주지 않는다. */
export type ReissueAccessTokenBody = SuccessResponse<{ accessToken: string }>;
