import Link from 'next/link';
import { Card, CardTitle } from '@ogonggo/ui';
import { httpClient } from '@ogonggo/api';
import type { PageInfo, SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import { JobBadge } from '@/entities/job/ui/JobBadge';
import { JobMeta } from '@/entities/job/ui/JobMeta';
import type { JobSummary } from '@/entities/job/model/types';
import type { JobListQuery } from '../lib/query';
import { Pagination } from './Pagination';
import { SearchFilterBar } from './SearchFilterBar';
import { SortToggle } from './SortToggle';

export type JobListProps = JobListQuery;

/**
 * `q`/`employmentType`/`experienceType`는 MSW 전용 파라미터라 생성 타입 `GetJobsParams`에 없다
 * (`packages/api/src/mocks/handlers.ts`, PRD 10절) — `getJobs(params)` 대신 URL을 직접 구성해
 * `httpClient`를 부른다. `httpClient`는 파싱된 body를 그대로 반환한다(orval 목 mutator 컨벤션인
 * `{ data, status, headers }`로 감싸지 않음) — 실제 런타임 값은 `getJobs`가 감싸는 `data` 필드
 * 하나(`SuccessResponsePageResponseUserJobSummaryResponse`)와 같다.
 */
function buildJobsRequestUrl({ page, sort, q, employmentType, experienceType }: JobListQuery): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('sort', sort);
  if (q) {
    params.set('q', q);
  }
  if (employmentType) {
    params.set('employmentType', employmentType);
  }
  if (experienceType) {
    params.set('experienceType', experienceType);
  }
  return `/api/v1/jobs?${params.toString()}`;
}

async function fetchJobPage(query: JobListQuery): Promise<{ items: JobSummary[]; pageInfo: PageInfo }> {
  const response = await httpClient<SuccessResponsePageResponseUserJobSummaryResponse>(
    buildJobsRequestUrl(query),
  );

  return (
    response.data ?? {
      items: [],
      pageInfo: { pageNum: query.page, pageSize: 10, totalElements: 0, totalPages: 0 },
    }
  );
}

/** 채용공고 목록을 카드로 렌더링한다. 빈 목록이면 빈 상태 문구를 보여준다. */
export async function JobList(query: JobListProps) {
  const { sort, q, employmentType, experienceType } = query;
  const { items, pageInfo } = await fetchJobPage(query);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900">전체 공고</h2>
        <div className="flex flex-wrap items-center gap-2">
          <SearchFilterBar
            q={q}
            employmentType={employmentType}
            experienceType={experienceType}
            sort={sort}
          />
          <SortToggle sort={sort} />
        </div>
      </div>
      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">채용공고가 없습니다.</p>
      ) : (
        <JobListItems items={items} />
      )}
      <Pagination pageInfo={pageInfo} sort={sort} />
    </div>
  );
}

function JobListItems({ items }: { items: JobSummary[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((job) => (
        <li key={job.id}>
          <Link href={`/jobs/${job.id}`}>
            <Card>
              <CardTitle>{job.title}</CardTitle>
              <JobMeta
                companyName={job.companyName}
                region={job.region}
                recruitmentType={job.recruitmentType}
                recruitmentEndAt={job.recruitmentEndAt}
              />
              <JobBadge
                employmentType={job.employmentType}
                experienceType={job.experienceType}
                educationLevel={job.educationLevel}
              />
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
