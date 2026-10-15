import { ListPublicJobsSort } from '@ogonggo/api';
import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_TYPE_LABELS,
  JOB_ROLES,
  jobRolesOf,
  REGION_LABELS,
  toJobField,
} from '@/entities/job/model/labels';
import type {
  JobEmploymentType,
  JobExperienceType,
  JobField,
  JobRegion,
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
  /** 채용 형태. 여럿이면 하나라도 맞는 공고를 보이고, 없으면 걸지 않는다. */
  employmentTypes?: JobEmploymentType[];
  /** 요구 경력. `employmentTypes` 와 같은 규칙이다. */
  experienceTypes?: JobExperienceType[];
  /**
   * 근무 지역(시·도). 다른 필터와 모양을 맞춰 배열이지만 하나만 든다 — `GET /api/v1/jobs` 의 `region` 이
   * 값 하나만 받는다(되풀이해 보내면 첫 값만 쓴다, 2026-10-15 실측). 없으면 걸지 않는다.
   */
  regions?: JobRegion[];
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
  for (const type of merged.employmentTypes ?? []) {
    params.append('employmentType', type);
  }
  for (const type of merged.experienceTypes ?? []) {
    params.append('experienceType', type);
  }
  // 하나만 싣는다. 여럿이 들어와도 API 는 첫 값만 쓰므로 주소가 실제 필터와 어긋나지 않게 맞춘다.
  if (merged.regions?.[0]) {
    params.set('region', merged.regions[0]);
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
 * 주소의 채용 형태·요구 경력을 읽는다. 값 하나(`?employmentType=FULL_TIME`)도, 같은 이름을 되풀이한
 * 것(`?employmentType=INTERN&employmentType=FULL_TIME`)도 읽힌다.
 *
 * 아는 값만 남긴다. `value in LABELS` 로 가르면 `toString` 같은 프로토타입 키가 통과해 API 가 400 을
 * 돌려주고 홈 전체가 에러 화면이 되므로 `Object.hasOwn` 으로 가른다. 겹친 값은 하나로 합치고 순서는
 * 옵션 순서로 맞춘다 — 같은 필터가 주소 두 개로 갈리지 않게. 하나도 안 남았거나 전부 골랐으면
 * `undefined`(걸지 않음)다.
 */
function parseEnumList<TValue extends string>(
  labels: Record<TValue, string>,
  value: string | string[] | undefined,
): TValue[] | undefined {
  const given = new Set([value ?? []].flat().filter((item) => Object.hasOwn(labels, item)));
  const options = Object.keys(labels) as TValue[];
  const picked = options.filter((option) => given.has(option));
  return picked.length > 0 && picked.length < options.length ? picked : undefined;
}

export function parseEmploymentTypes(
  value: string | string[] | undefined,
): JobEmploymentType[] | undefined {
  return parseEnumList(EMPLOYMENT_TYPE_LABELS, value);
}

export function parseExperienceTypes(
  value: string | string[] | undefined,
): JobExperienceType[] | undefined {
  return parseEnumList(EXPERIENCE_TYPE_LABELS, value);
}

/**
 * 주소의 `region`. 아는 시·도 하나만 남기고, 같은 이름이 되풀이되면 첫 값만 본다. 모르는 값은 버린다 —
 * 그대로 보내면 API 가 400 을 돌려줘 홈 전체가 에러 화면이 된다. `Object.hasOwn` 인 이유는
 * `parseEnumList` 와 같다(`toString` 같은 프로토타입 키).
 */
export function parseRegions(value: string | string[] | undefined): JobRegion[] | undefined {
  const first = [value ?? []].flat()[0];
  return first !== undefined && Object.hasOwn(REGION_LABELS, first)
    ? [first as JobRegion]
    : undefined;
}

/** 주소의 `q`. 같은 이름이 되풀이돼 배열로 와도 첫 값만 쓴다. */
export function parseKeywordParam(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first || undefined;
}

/**
 * 주소의 `jobField`·`jobRole` 을 검증해 고른 상태로 만든다. 모르는 값은 버리고, `전체` 로 고른
 * 직군에 속한 직무도 버린다 — 겹쳐 적힌 주소를 한 모양으로 맞춘다. 없어진 직군은 합쳐진 직군으로
 * 읽고(`toJobField`), 그래서 겹친 직군은 하나로 합친다.
 */
export function parseJobRoleSelection(
  jobField: string | string[] | undefined,
  jobRole: string | string[] | undefined,
): Pick<JobListQuery, 'jobFields' | 'jobRoles'> {
  const list = (value: string | string[] | undefined) =>
    [value ?? []].flat().filter((item, index, all) => all.indexOf(item) === index);
  const jobFields = [...new Set(list(jobField).map(toJobField))].filter(
    (value): value is JobField => value !== undefined,
  );
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

/** 백엔드가 받는 검색어 길이(2~100자). 입력창의 `minLength`·`maxLength` 도 이 값을 쓴다. */
export const KEYWORD_MIN_LENGTH = 2;
export const KEYWORD_MAX_LENGTH = 100;

/** 길이를 벗어나면 400 이라 화면 전체가 에러가 되므로 검색어 없이 보낸다. */
function pickKeyword(q: string | undefined): string | undefined {
  const keyword = q?.trim();
  return keyword && keyword.length >= KEYWORD_MIN_LENGTH && keyword.length <= KEYWORD_MAX_LENGTH
    ? keyword
    : undefined;
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
  // 같은 이름을 되풀이해 싣는다. 쉼표로 이으면 백엔드가 400 을 돌려준다(2026-10-11 운영 실측).
  for (const type of query.employmentTypes ?? []) {
    params.append('employmentType', type);
  }
  for (const type of query.experienceTypes ?? []) {
    params.append('experienceType', type);
  }
  if (query.regions?.[0]) {
    params.set('region', query.regions[0]);
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
