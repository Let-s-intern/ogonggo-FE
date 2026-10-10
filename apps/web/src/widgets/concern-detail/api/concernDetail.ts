import {
  getPublicConcern,
  type ConcernDetailResponse,
  type SuccessResponseConcernDetailResponse,
} from '@ogonggo/api';

/**
 * 고민글 상세 `getPublicConcern`(`GET /api/v1/concerns/{concernId}`). 토큰을 보내면 `mine` 이 채워진다.
 * 서버 컴포넌트의 요청에는 토큰이 실리지 않으므로(`shared/api/authTokens.ts`) 서버가 부르면 `mine` 은
 * 늘 `false` 다. 그 값은 브라우저가 한 번 더 읽어 채운다(`model/useConcernMine.ts`).
 *
 * 생성 함수의 반환 타입은 `{ data, status, headers }` 봉투지만 `httpClient` 는 본문을 그대로 돌려준다 —
 * 다른 기능의 호출과 같은 캐스팅이다. 2xx 가 아니면 `HttpError` 로 던진다.
 *
 * 백엔드는 상세를 읽을 때마다 조회수를 1 올린다(PRD 결정 8). 이 함수를 부르는 횟수가 곧 조회수다.
 */
export async function readConcernDetail(concernId: number): Promise<ConcernDetailResponse | null> {
  const response = (await getPublicConcern(
    concernId,
  )) as unknown as SuccessResponseConcernDetailResponse;
  return response.data ?? null;
}
