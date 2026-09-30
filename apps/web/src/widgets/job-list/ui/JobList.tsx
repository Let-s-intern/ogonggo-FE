import { ListPublicJobsSort, httpClient } from '@ogonggo/api';
import type { PageInfo, SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import { JobCard } from '@/entities/job/ui/JobCard';
import type { JobSummary } from '@/entities/job/model/types';
import { NumberedPagination } from '@/shared/ui/NumberedPagination';
import { SortToggle, type SortOption } from '@/shared/ui/SortToggle';
import { buildJobListHref, buildJobsApiUrl, type JobListQuery } from '../lib/query';
import { SearchFilterBar } from './SearchFilterBar';

const SORT_OPTIONS: SortOption<ListPublicJobsSort>[] = [
  { value: ListPublicJobsSort.LATEST, label: '최신순' },
  { value: ListPublicJobsSort.VIEW_COUNT, label: '조회순' },
];

export type JobListProps = JobListQuery;

/**
 * `httpClient`는 파싱된 body를 그대로 반환한다(orval 목 mutator 컨벤션인 `{ data, status, headers }`로
 * 감싸지 않음) — 실제 런타임 값은 `listPublicJobs`가 감싸는 `data` 필드 하나
 * (`SuccessResponsePageResponseUserJobSummaryResponse`)와 같다. 요청 주소는 `buildJobsApiUrl`.
 */
const PAGE_SIZE = 12;

async function fetchJobPage(
  query: JobListQuery,
): Promise<{ items: JobSummary[]; pageInfo: PageInfo }> {
  const response = await httpClient<SuccessResponsePageResponseUserJobSummaryResponse>(
    buildJobsApiUrl(query, PAGE_SIZE),
  );

  return (
    response.data ?? {
      items: [],
      pageInfo: { pageNum: query.page, pageSize: PAGE_SIZE, totalElements: 0, totalPages: 0 },
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
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <SearchFilterBar query={query} />
          <SortToggle
            options={SORT_OPTIONS}
            current={query.sort}
            buildHref={(sort) => buildJobListHref(query, { sort })}
          />
        </div>
      </div>
      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">채용공고가 없습니다.</p>
      ) : (
        <JobListItems items={items} pageNumber={pageInfo.pageNum} />
      )}
      <NumberedPagination
        pageInfo={pageInfo}
        buildHref={(page) => buildJobListHref(query, { page })}
      />
    </div>
  );
}

/**
 * `home.png`의 "전체 공고" 4열 그리드(3.4절) — `entities/job/ui/JobCard.tsx`를 그대로 써서
 * "인기 공고"(`widgets/popular-jobs`)와 완전히 같은 카드 디자인을 보장한다.
 */
function JobListItems({ items, pageNumber }: { items: JobSummary[]; pageNumber: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
      {items.map((job, index) => (
        <li key={job.id}>
          <JobCard
            job={job}
            tracking={{ listSource: 'main', listPosition: index + 1, pageNumber }}
          />
        </li>
      ))}
    </ul>
  );
}
