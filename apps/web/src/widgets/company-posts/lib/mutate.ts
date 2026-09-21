import { closeMyBootcamp, closeMyJob, deleteMyBootcamp, deleteMyJob } from '@ogonggo/api';
import type { CompanyPostTab } from './query';

/**
 * 목록에서 한 건에 거는 동작(v5 PRD 2 절). 탭마다 경로가 달라 여기 한 곳에 모은다 —
 * `DELETE /api/v1/users/me/jobs/{jobId}`, `DELETE /api/v1/users/me/bootcamps/{bootcampId}`.
 *
 * **복사는 없다.** 기업 공고에는 복사 API 가 없고(모집글의 `copyMyRecruitmentPost` 에만
 * 있다), 상세를 읽어 새로 만드는 방식으로 흉내 내면 공고 필드가 하나 늘 때마다 이 파일도
 * 같이 고쳐야 한다. 놓치면 필드가 조용히 빠진 공고가 생긴다.
 */
export async function deleteCompanyPost(tab: CompanyPostTab, id: number): Promise<void> {
  if (tab === 'jobs') {
    await deleteMyJob(id);
    return;
  }
  await deleteMyBootcamp(id);
}

/**
 * 모집을 마감한다. `POST /api/v1/users/me/jobs/{jobId}/close`,
 * `POST /api/v1/users/me/bootcamps/{bootcampId}/close`.
 *
 * 채용공고는 이미 마감한 것을 다시 마감해도 최초 마감 일시를 지킨다(생성 타입 설명).
 * 부트캠프는 마감할 수 없는 상태면 409 를 준다 — 그 실패는 화면이 표 위 한 줄로 알린다.
 */
export async function closeCompanyPost(tab: CompanyPostTab, id: number): Promise<void> {
  if (tab === 'jobs') {
    await closeMyJob(id);
    return;
  }
  await closeMyBootcamp(id);
}
