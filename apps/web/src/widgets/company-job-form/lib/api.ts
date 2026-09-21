import {
  getMyJob,
  type CompanyJobDetailResponse,
  type SuccessResponseCompanyJobDetailResponse,
} from '@ogonggo/api';

/**
 * 채용공고 작성·수정 화면이 하는 호출을 모은 곳(v5 PRD 3 절).
 *
 * | 하는 일 | 생성 함수 | 경로 |
 * |---|---|---|
 * | 폼 조회 | `getMyJob` | `GET /api/v1/users/me/jobs/{jobId}` |
 *
 * 생성 타입은 응답을 `{ data, status, headers }` 로 감싼 모양이지만 `httpClient` 는 본문을
 * 그대로 돌려준다(`widgets/company-posts/lib/fetch.ts` 의 같은 주석). 그래서 한 번 단언한다.
 */

/** 수정 화면이 채울 값. 초안·게시·숨김 어느 상태든 내 공고면 읽는다. */
export async function fetchMyJob(jobId: number): Promise<CompanyJobDetailResponse | undefined> {
  const body = (await getMyJob(jobId)) as unknown as SuccessResponseCompanyJobDetailResponse;
  return body.data;
}
