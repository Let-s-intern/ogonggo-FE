import {
  createMyJob,
  getMyJob,
  HttpError,
  publishMyJob,
  replaceMyJob,
  type CompanyJobDetailResponse,
  type CreateCompanyJobRequest,
  type SuccessResponseCompanyJobDetailResponse,
  type SuccessResponseCreateCompanyJobResponse,
} from '@ogonggo/api';

/**
 * 채용공고 작성·수정 화면이 하는 호출을 모은 곳(v5 PRD 3 절).
 *
 * | 하는 일 | 생성 함수 | 경로 |
 * |---|---|---|
 * | 폼 조회 | `getMyJob` | `GET /api/v1/users/me/jobs/{jobId}` |
 * | 등록 | `createMyJob` | `POST /api/v1/users/me/jobs` |
 * | 수정 | `replaceMyJob` | `PUT /api/v1/users/me/jobs/{jobId}` |
 * | 게시 | `publishMyJob` | `POST /api/v1/users/me/jobs/{jobId}/publish` |
 *
 * 대표 이미지 업로드는 부트캠프 폼도 같은 것을 쓰게 되어 `shared/lib/uploadImage.ts` 로
 * 옮겼다.
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
 * 새 공고를 만든다. **언제나 초안으로 만들어진다**(생성 타입 설명) — 지원자에게 보이려면
 * 게시를 따로 요청해야 한다. 응답은 만들어진 공고의 id 다.
 */
export async function createJob(request: CreateCompanyJobRequest): Promise<number | undefined> {
  const body = (await createMyJob(request)) as unknown as SuccessResponseCreateCompanyJobResponse;
  return body.data?.id;
}

/**
 * 기존 공고를 고친다. **전체 교체라 보내지 않은 칸은 비워진다** — 화면이 읽어 온 값을 그대로
 * 다시 실어야 한다(`model/values.ts` 의 `CompanyJobPassthrough`).
 */
export async function replaceJob(jobId: number, request: CreateCompanyJobRequest): Promise<void> {
  await replaceMyJob(jobId, request);
}

/**
 * 공고를 지원자에게 노출한다.
 *
 * **승인된 공고만 게시할 수 있고, 그렇지 않으면 409 다**(생성 타입 설명). 새로 쓴 공고도,
 * 고친 공고도 먼저 운영자 검수를 거치므로 409 가 오히려 보통이다. 그래서 409 는 실패로 보지
 * 않고 `false` 로 돌려준다 — 저장은 끝났고 게시만 검수 뒤로 미뤄진 것이다. 목록의 심사 열이
 * 그 상태를 그대로 보여 준다(`widgets/company-posts/model/status.ts`).
 */
export async function publishJob(jobId: number): Promise<boolean> {
  try {
    await publishMyJob(jobId);
    return true;
  } catch (error) {
    if (error instanceof HttpError && error.status === 409) {
      return false;
    }
    throw error;
  }
}
