import Link from 'next/link';
import { httpClient } from '@ogonggo/api';
import type { PageInfo, SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import { computeDday } from '@/entities/job/model/dday';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '@/entities/job/model/labels';
import { JobMeta } from '@/entities/job/ui/JobMeta';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
import type { JobSummary } from '@/entities/job/model/types';
import type { JobListQuery } from '../lib/query';
import { NumberedPagination } from './NumberedPagination';
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
  const { items, pageInfo } = await fetchJobPage(query);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900">전체 공고</h2>
        <div className="flex flex-wrap items-center gap-2">
          <SearchFilterBar query={query} />
          <SortToggle query={query} />
        </div>
      </div>
      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">채용공고가 없습니다.</p>
      ) : (
        <JobListItems items={items} />
      )}
      <NumberedPagination pageInfo={pageInfo} query={query} />
    </div>
  );
}

/**
 * `home.png`의 "전체 공고" 4열 그리드(3.4절) — 회색 placeholder, 북마크 우상단, 배지, 회사명,
 * 제목. 지역은 목업의 이 카드 변형엔 안 보이지만 PRD 5절의 "제목·회사명·지역" 표시 요구가
 * 우선이라 `JobMeta`(회사명·지역·마감 한 줄)를 그대로 쓴다.
 */
function JobListItems({ items }: { items: JobSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
      {items.map((job) => (
        <li key={job.id}>
          <Link href={`/jobs/${job.id}`} className="flex flex-col gap-2">
            <JobThumbnail
              bookmarked={job.bookmarked}
              dday={computeDday(job.recruitmentType, job.recruitmentEndAt)}
            />
            <p className="text-xs text-gray-400">
              {EMPLOYMENT_TYPE_LABELS[job.employmentType]} · {EXPERIENCE_TYPE_LABELS[job.experienceType]}
            </p>
            <JobMeta
              companyName={job.companyName}
              region={job.region}
              recruitmentType={job.recruitmentType}
              recruitmentEndAt={job.recruitmentEndAt}
              showDeadline={false}
            />
            <p className="line-clamp-2 text-sm font-bold text-gray-900">{job.title}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
