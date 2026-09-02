import { GetJobsSort } from '@ogonggo/api';
import type { JobEmploymentType, JobExperienceType } from '@/entities/job/model/types';

/**
 * "전체 공고" 검색/필터/정렬/페이지네이션이 공유하는 URL 쿼리 상태. `q`/`employmentType`/
 * `experienceType`는 실제 백엔드에 없는 MSW 전용 파라미터다(PRD 10절, `packages/api/src/mocks/
 * handlers.ts`).
 */
export interface JobListQuery {
  page: number;
  sort: GetJobsSort;
  q?: string;
  employmentType?: JobEmploymentType;
  experienceType?: JobExperienceType;
}

/**
 * 기본값(`page=1`, `sort=LATEST`)은 URL에서 생략한다 — 기존 `Pagination`/`SortToggle`이 이미
 * 하던 방식 그대로. `overrides`에 없는 필드는 `base`를 그대로 쓴다.
 */
export function buildJobListHref(
  base: JobListQuery,
  overrides: Partial<JobListQuery> = {},
): string {
  const merged: JobListQuery = { ...base, ...overrides };
  const params = new URLSearchParams();

  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }
  if (merged.sort !== GetJobsSort.LATEST) {
    params.set('sort', merged.sort);
  }
  if (merged.q) {
    params.set('q', merged.q);
  }
  if (merged.employmentType) {
    params.set('employmentType', merged.employmentType);
  }
  if (merged.experienceType) {
    params.set('experienceType', merged.experienceType);
  }

  const query = params.toString();
  return query ? `/?${query}` : '/';
}
