import {
  getMyBootcamp,
  type CompanyBootcampDetailResponse,
  type SuccessResponseCompanyBootcampDetailResponse,
} from '@ogonggo/api';

/**
 * 교육·부트캠프 작성·수정 화면이 하는 호출을 모은 곳(v5 PRD 4 절).
 *
 * | 하는 일 | 생성 함수 | 경로 |
 * |---|---|---|
 * | 폼 조회 | `getMyBootcamp` | `GET /api/v1/users/me/bootcamps/{bootcampId}` |
 *
 * 대표 이미지 업로드는 채용공고 폼과 같은 `shared/lib/uploadImage.ts` 를 쓴다.
 *
 * 생성 타입은 응답을 `{ data, status, headers }` 로 감싼 모양이지만 `httpClient` 는 본문을
 * 그대로 돌려준다(`widgets/company-posts/lib/fetch.ts` 의 같은 주석). 그래서 한 번 단언한다.
 */

/** 수정 화면이 채울 값. 임시저장·모집중·마감 어느 상태든 내 공고면 읽는다. */
export async function fetchMyBootcamp(
  bootcampId: number,
): Promise<CompanyBootcampDetailResponse | undefined> {
  const body = (await getMyBootcamp(
    bootcampId,
  )) as unknown as SuccessResponseCompanyBootcampDetailResponse;
  return body.data;
}
