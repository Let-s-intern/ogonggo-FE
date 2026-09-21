import { deleteMyBootcamp, deleteMyJob } from '@ogonggo/api';
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
