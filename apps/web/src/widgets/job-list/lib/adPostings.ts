import type { JobSummary } from '@/entities/job/model/types';
import { pickKeyword, toJobRoleParams, type JobListQuery } from './query';

/**
 * 광고 공고가 지금 목록의 검색·필터에 맞는지(D13). 필터를 건 목록에 조건과 다른 광고가 끼면 필터가 고장 난 것처럼
 * 보인다. 백엔드가 광고를 거르지 않아 카드 요약 값으로 여기서 맞춘다.
 *
 * 규칙은 `GET /api/v1/jobs` 와 같게 둔다 — 한 필터 안에서는 하나라도 맞으면, 필터끼리는 모두 맞아야 한다. 검색어는
 * 제목·회사명에 들었는지만 본다. 백엔드 검색이 다른 칸까지 본다면 그 광고는 여기서 빠진다(빠지는 쪽이 낫다).
 */
export function matchesJobQuery(job: JobSummary, query: JobListQuery): boolean {
  const keyword = pickKeyword(query.q)?.toLowerCase();
  if (keyword && !`${job.title} ${job.companyName}`.toLowerCase().includes(keyword)) {
    return false;
  }
  if (query.employmentTypes?.length && !query.employmentTypes.includes(job.employmentType)) {
    return false;
  }
  if (query.experienceTypes?.length && !query.experienceTypes.includes(job.experienceType)) {
    return false;
  }
  const region = query.regions?.[0];
  if (region && job.region !== region) {
    return false;
  }
  const { jobField, jobRole } = toJobRoleParams(query);
  if (jobField && job.jobField !== jobField) {
    return false;
  }
  if (jobRole.length > 0 && !(job.jobRole && jobRole.includes(job.jobRole))) {
    return false;
  }
  return true;
}
