import {
  createMyBootcamp,
  getMyBootcamp,
  HttpError,
  replaceMyBootcamp,
  startMyBootcampRecruitment,
  type CompanyBootcampDetailResponse,
  type CreateCompanyBootcampRequest,
  type SuccessResponseCompanyBootcampDetailResponse,
  type SuccessResponseCreateCompanyBootcampResponse,
  type UpdateCompanyBootcampRequest,
} from '@ogonggo/api';

/**
 * 교육·부트캠프 작성·수정 화면이 하는 호출을 모은 곳(v5 PRD 4 절).
 *
 * | 하는 일 | 생성 함수 | 경로 |
 * |---|---|---|
 * | 폼 조회 | `getMyBootcamp` | `GET /api/v1/users/me/bootcamps/{bootcampId}` |
 * | 등록 | `createMyBootcamp` | `POST /api/v1/users/me/bootcamps` |
 * | 수정 | `replaceMyBootcamp` | `PUT /api/v1/users/me/bootcamps/{bootcampId}` |
 * | 모집 시작 | `startMyBootcampRecruitment` | `POST /api/v1/users/me/bootcamps/{id}/start-recruitment` |
 *
 * **채용공고와 갈리는 곳이 모집 시작이다.** 부트캠프에는 `/publish` 가 없다(v5 PRD 4 절).
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

/**
 * 새 부트캠프를 만든다. 응답은 만들어진 공고의 id 다.
 *
 * **채용공고와 달리 생성 요청이 `status` 를 받는다**(`DRAFT`|`RECRUITING`|`CLOSED`). 화면은
 * 언제나 `DRAFT` 로 만들고, 공개로 만드는 일은 `startBootcampRecruitment` 에 맡긴다 — 수정
 * 요청(`UpdateCompanyBootcampRequest`) 에는 `status` 가 없어 새 공고만 두 길을 가지게 되고,
 * 그러면 같은 버튼이 새 공고와 수정에서 다른 방식으로 공개를 만들게 된다.
 */
export async function createBootcamp(
  request: CreateCompanyBootcampRequest,
): Promise<number | undefined> {
  const body = (await createMyBootcamp(
    request,
  )) as unknown as SuccessResponseCreateCompanyBootcampResponse;
  return body.data?.id;
}

/**
 * 기존 부트캠프를 고친다. **전체 교체라 보내지 않은 칸은 비워진다** — 화면이 읽어 온 값을
 * 그대로 다시 실어야 한다(`model/values.ts` 의 `CompanyBootcampPassthrough`).
 *
 * 이 요청은 모집 상태를 바꾸지 않는다. `UpdateCompanyBootcampRequest` 에 `status` 가 없다.
 */
export async function replaceBootcamp(
  bootcampId: number,
  request: UpdateCompanyBootcampRequest,
): Promise<void> {
  await replaceMyBootcamp(bootcampId, request);
}

/**
 * 부트캠프를 모집 중으로 만든다(`POST /users/me/bootcamps/{id}/start-recruitment`).
 *
 * 409 는 실패로 보지 않고 `false` 로 돌려준다 — 이미 모집 중이거나 운영자 검수를 기다리는
 * 경우다. 저장은 끝났고 공개만 미뤄진 것이라, 빨간 줄을 띄우면 저장이 실패한 것으로 읽힌다
 * (채용공고의 `publishJob` 과 같은 판단이다). 방금 만든 공고가 어떤 상태인지는 목록의
 * 심사·게시 열이 말한다.
 */
export async function startBootcampRecruitment(bootcampId: number): Promise<boolean> {
  try {
    await startMyBootcampRecruitment(bootcampId);
    return true;
  } catch (error) {
    if (error instanceof HttpError && error.status === 409) {
      return false;
    }
    throw error;
  }
}
