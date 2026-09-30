import { ListPublicJobsSort } from '@ogonggo/api';
import { JOB_FIELD_LABELS, JOB_ROLES, jobRolesOf } from '@/entities/job/model/labels';
import type {
  JobEmploymentType,
  JobExperienceType,
  JobField,
  JobRole,
} from '@/entities/job/model/types';

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
  /** 직무 필터에서 `전체` 로 고른 직군들. */
  jobFields?: JobField[];
  /** 하나씩 고른 직무들. `jobFields` 에 든 직군의 직무는 싣지 않는다 — 이미 전부 골랐다. */
  jobRoles?: JobRole[];
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
  for (const field of merged.jobFields ?? []) {
    params.append('jobField', field);
  }
  for (const role of merged.jobRoles ?? []) {
    params.append('jobRole', role);
  }

  const query = params.toString();
  return query ? `/?${query}` : '/';
}

/**
 * 주소의 `jobField`·`jobRole` 을 검증해 고른 상태로 만든다. 모르는 값은 버리고, `전체` 로 고른
 * 직군에 속한 직무도 버린다 — 겹쳐 적힌 주소를 한 모양으로 맞춘다.
 */
export function parseJobRoleSelection(
  jobField: string | string[] | undefined,
  jobRole: string | string[] | undefined,
): Pick<JobListQuery, 'jobFields' | 'jobRoles'> {
  const list = (value: string | string[] | undefined) =>
    [value ?? []].flat().filter((item, index, all) => all.indexOf(item) === index);
  const jobFields = list(jobField).filter((value): value is JobField => value in JOB_FIELD_LABELS);
  const jobRoles = list(jobRole).filter(
    (value): value is JobRole =>
      value in JOB_ROLES && !jobFields.includes(JOB_ROLES[value as JobRole].field),
  );
  return {
    jobFields: jobFields.length > 0 ? jobFields : undefined,
    jobRoles: jobRoles.length > 0 ? jobRoles : undefined,
  };
}

/**
 * 고른 직군·직무를 API 파라미터로 옮긴다. 백엔드는 `jobField` 를 하나만 받고, `jobRole` 여럿은
 * 합집합, 둘을 같이 주면 교집합이다. 그래서 직군 `전체` 는 그 직군의 직무 전부로 펼쳐 `jobRole`
 * 하나로 합친다 — 직군 건수와 그 직군 직무 전부의 합집합 건수가 같다(2026-09-30 실측: IT·개발
 * 78=78, 의료·보건 754=754, 서비스 668=668).
 *
 * 직군 하나만 `전체` 로 고른 경우만 `jobField` 로 보낸다. 직무 스무 개를 늘어놓는 것보다 짧다.
 */
export function toJobRoleParams({
  jobFields = [],
  jobRoles = [],
}: Pick<JobListQuery, 'jobFields' | 'jobRoles'>): { jobField?: JobField; jobRole: JobRole[] } {
  if (jobFields.length === 1 && jobRoles.length === 0) {
    return { jobField: jobFields[0], jobRole: [] };
  }
  return { jobRole: [...jobFields.flatMap(jobRolesOf), ...jobRoles] };
}

/** 백엔드가 2~100자만 받는다. 벗어나면 400 이라 화면 전체가 에러가 되므로 검색어 없이 보낸다. */
function pickKeyword(q: string | undefined): string | undefined {
  const keyword = q?.trim();
  return keyword && keyword.length >= 2 && keyword.length <= 100 ? keyword : undefined;
}

/**
 * `GET /api/v1/jobs` 요청 주소. 목록과 직무 창의 건수(`size=1`)가 같이 쓴다 — 둘이 따로 만들면
 * 창에 보인 건수와 누른 뒤 목록 건수가 어긋난다.
 *
 * 화면 주소의 검색어 이름은 `q`, API 는 `keyword` 다. 전에는 `q` 를 그대로 보내 백엔드가 모르는
 * 파라미터로 무시했다 — 검색해도 전체 목록이 왔다(2026-09-30 실측, 5,198건 그대로). 주소의 `q` 는
 * 바깥에 공유된 링크가 쓰는 이름이라 두고, 보내는 이름만 바꾼다.
 */
export function buildJobsApiUrl(query: JobListQuery, size: number): string {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('size', String(size));
  params.set('sort', query.sort);
  const keyword = pickKeyword(query.q);
  if (keyword) {
    params.set('keyword', keyword);
  }
  if (query.employmentType) {
    params.set('employmentType', query.employmentType);
  }
  if (query.experienceType) {
    params.set('experienceType', query.experienceType);
  }
  const { jobField, jobRole } = toJobRoleParams(query);
  if (jobField) {
    params.set('jobField', jobField);
  }
  for (const role of jobRole) {
    params.append('jobRole', role);
  }
  return `/api/v1/jobs?${params.toString()}`;
}
