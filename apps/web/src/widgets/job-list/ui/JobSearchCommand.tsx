'use client';

import { useRouter } from 'next/navigation';
import { httpClient } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import { JOB_FIELD_LABELS, JOB_ROLES } from '@/entities/job/model/labels';
import type {
  JobEmploymentType,
  JobExperienceType,
  JobField,
  JobRegion,
  JobRole,
} from '@/entities/job/model/types';
import {
  SearchCommand,
  type SearchField,
  type SearchFilters,
  type SearchRequest,
} from '@/features/search-command';
import { FILTER_GROUPS } from '../lib/filter';
import { rememberJobFilters } from '../lib/filterCookie';
import { buildJobListHref, buildJobsApiUrl, type JobListQuery } from '../lib/query';

const toOptions = (entries: readonly (readonly [string, string])[]) =>
  entries.map(([value, label]) => ({ value, label }));

/**
 * 검색 모달이 칩으로 바꿀 항목. 낱말이 두 항목에 똑같이 맞으면 앞의 항목이 먼저다 — `개발` 은 `IT·개발`
 * 직군이지 `기타IT·개발` 직무가 아니다. 이름(`지역`)은 `지역:서울` 처럼 앞에 붙이는 말이기도 하다.
 */
const JOB_SEARCH_FIELDS: SearchField[] = [
  {
    key: 'regions',
    label: '지역',
    options: toOptions(FILTER_GROUPS.regions.options),
    single: true,
  },
  {
    key: 'employmentTypes',
    label: '형태',
    options: toOptions(FILTER_GROUPS.employmentTypes.options),
  },
  {
    key: 'experienceTypes',
    label: '경력',
    options: toOptions(FILTER_GROUPS.experienceTypes.options),
  },
  { key: 'jobFields', label: '직군', options: toOptions(Object.entries(JOB_FIELD_LABELS)) },
  {
    key: 'jobRoles',
    label: '직무',
    // 직무마다 직군을 단다. 직무 칩에 직군이 함께 보이고, 직군을 치면 그 직무들이 펼쳐진다.
    options: Object.entries(JOB_ROLES).map(([value, { label, field }]) => ({
      value,
      label,
      parent: field,
    })),
    parentField: 'jobFields',
  },
];

const orUndefined = <T,>(values: T[] | undefined) =>
  values && values.length > 0 ? values : undefined;

/** 모달이 고른 칩을 목록 주소의 필터로. 통째로 고른 직군의 직무는 뺀다 — 주소 규칙이 그렇다(`JobListQuery`). */
function toQueryFilters(filters: SearchFilters): Partial<JobListQuery> {
  const jobFields = (filters.jobFields ?? []) as JobField[];
  return {
    employmentTypes: orUndefined(filters.employmentTypes as JobEmploymentType[]),
    experienceTypes: orUndefined(filters.experienceTypes as JobExperienceType[]),
    regions: orUndefined(filters.regions as JobRegion[]),
    jobFields: orUndefined(jobFields),
    jobRoles: orUndefined(
      ((filters.jobRoles ?? []) as JobRole[]).filter(
        (role) => !jobFields.includes(JOB_ROLES[role].field),
      ),
    ),
  };
}

function toSearchFilters(query: JobListQuery): SearchFilters {
  return {
    regions: query.regions ?? [],
    employmentTypes: query.employmentTypes ?? [],
    experienceTypes: query.experienceTypes ?? [],
    jobFields: query.jobFields ?? [],
    jobRoles: query.jobRoles ?? [],
  };
}

/** 이 검색어·필터로 몇 건인지. 모바일 필터 시트의 `N개 공고보기` 와 같은 방법이다(`JobFilterSheet`). */
async function countJobs(query: JobListQuery, request: SearchRequest) {
  const response = await httpClient<SuccessResponsePageResponseUserJobSummaryResponse>(
    buildJobsApiUrl({ ...query, page: 1, q: request.q, ...toQueryFilters(request.filters) }, 1),
  );
  return response.data?.pageInfo.totalElements;
}

/**
 * 채용공고 목록의 검색칸. 검색 모달(`features/search-command`)에 이 목록의 필터 항목과 건수 조회를 붙인다.
 * 모달에서 고른 칩은 지금 필터를 통째로 바꾼다 — 모달을 열면 지금 필터가 칩으로 보이고, 지운 칩은 풀린다.
 *
 * `onSearch` 가 있으면(왼쪽 필터 `JobFilterSidebar`) 그쪽이 옮기고, 없으면 여기서 주소를 바꾼다. 정렬은 그대로,
 * 쪽은 1쪽이다.
 */
export function JobSearchCommand({
  query,
  onSearch,
  value = query.q,
}: {
  query: JobListQuery;
  onSearch?: (q: string | undefined, filters: Partial<JobListQuery>) => void;
  /** 검색칸에 보일 검색어. 왼쪽 필터는 주소보다 앞선 값(`draft`)을 넘긴다. */
  value?: string;
}) {
  const router = useRouter();

  return (
    <SearchCommand
      scope="jobs"
      value={value}
      fields={JOB_SEARCH_FIELDS}
      filters={toSearchFilters(query)}
      countOf={(request) => countJobs(query, request)}
      onSearch={(request) => {
        const filters = toQueryFilters(request.filters);
        if (onSearch) {
          onSearch(request.q, filters);
          return;
        }
        const href = buildJobListHref(query, { q: request.q, ...filters });
        rememberJobFilters(href);
        router.push(href);
      }}
    />
  );
}
