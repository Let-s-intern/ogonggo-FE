import { ListPublicJobsSort } from '@ogonggo/api';
import type { JobEmploymentType, JobExperienceType } from '@/entities/job/model/types';

/**
 * "전체 공고" 검색/필터/정렬/페이지네이션이 공유하는 URL 쿼리 상태. 검색어는 주소에서 `q`, API 로는
 * `keyword` 로 나간다(`JobList.tsx`).
 */
export interface JobListQuery {
  page: number;
  sort: ListPublicJobsSort;
  q?: string;
  employmentType?: JobEmploymentType;
  experienceType?: JobExperienceType;
}

/**
 * 기본값(`page=1`, `sort=LATEST`)은 URL에서 생략한다 — 기존 `Pagination`/`SortToggle`이 이미
 * 하던 방식 그대로. `overrides`에 없는 필드는 `base`를 그대로 쓴다.
 *
 * 단 `page` 는 `overrides` 에 없으면 1 로 돌아간다. 필터·정렬을 바꾸면 결과 쪽수가 달라지는데,
 * 전에는 5쪽에서 필터를 고르면 걸러진 목록의 5쪽으로 가서 빈 목록이 뜰 수 있었다.
 */
export function buildJobListHref(
  base: JobListQuery,
  overrides: Partial<JobListQuery> = {},
): string {
  const merged: JobListQuery = { ...base, page: 1, ...overrides };
  const params = new URLSearchParams();

  if (merged.page > 1) {
    params.set('page', String(merged.page));
  }
  if (merged.sort !== ListPublicJobsSort.LATEST) {
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
