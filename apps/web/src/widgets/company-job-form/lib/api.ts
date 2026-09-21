import {
  createImage,
  getMyJob,
  type CompanyJobDetailResponse,
  type SuccessResponseCompanyJobDetailResponse,
  type SuccessResponseImageUploadResponse,
} from '@ogonggo/api';

/**
 * 채용공고 작성·수정 화면이 하는 호출을 모은 곳(v5 PRD 3 절).
 *
 * | 하는 일 | 생성 함수 | 경로 |
 * |---|---|---|
 * | 폼 조회 | `getMyJob` | `GET /api/v1/users/me/jobs/{jobId}` |
 * | 대표 이미지 업로드 | `createImage` | `POST /api/v1/images` |
 *
 * 생성 타입은 응답을 `{ data, status, headers }` 로 감싼 모양이지만 `httpClient` 는 본문을
 * 그대로 돌려준다(`widgets/company-posts/lib/fetch.ts` 의 같은 주석). 그래서 한 번 단언한다.
 */

/** 수정 화면이 채울 값. 초안·게시·숨김 어느 상태든 내 공고면 읽는다. */
export async function fetchMyJob(jobId: number): Promise<CompanyJobDetailResponse | undefined> {
  const body = (await getMyJob(jobId)) as unknown as SuccessResponseCompanyJobDetailResponse;
  return body.data;
}

/**
 * 공고 대표 이미지를 올리고 표시용 주소를 돌려준다(v5 PRD 3 절).
 *
 * `multipart/form-data` 한 칸(`file`) 이고, 응답의 `url` 이 그대로 `coverImageUrl` 에 들어간다.
 * 이미지는 여기서 임시 저장되고 공고를 저장할 때 연결된다 — 그래서 올린 뒤 저장하지 않으면
 * 공고에 붙지 않는다.
 */
export async function uploadImage(file: File): Promise<string | undefined> {
  const body = (await createImage({ file })) as unknown as SuccessResponseImageUploadResponse;
  return body.data?.url;
}
