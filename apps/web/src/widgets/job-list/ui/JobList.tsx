import Link from 'next/link';
import { Card, CardTitle } from '@ogonggo/ui';
import { getJobs } from '@ogonggo/api';
import type {
  GetJobsParams,
  GetJobsSort,
  PageInfo,
  SuccessResponsePageResponseUserJobSummaryResponse,
} from '@ogonggo/api';
import { JobBadge } from '@/entities/job/ui/JobBadge';
import { JobMeta } from '@/entities/job/ui/JobMeta';
import type { JobSummary } from '@/entities/job/model/types';
import { Pagination } from './Pagination';
import { SortToggle } from './SortToggle';

export interface JobListProps {
  page: number;
  sort: GetJobsSort;
}

/**
 * `getJobs`(packages/api/src/generated/user/endpoints.ts)의 선언 타입은 orval의
 * 기본 fetch mutator 컨벤션대로 `{ data, status, headers }`로 감싼 응답을 가정하지만,
 * 이 저장소의 `httpClient`(packages/api/src/lib/http-client.ts)는 파싱된 body를
 * 그대로 반환한다 — 즉 실제 런타임 값은 `getJobs`가 감싸는 `data` 필드 하나
 * (`SuccessResponsePageResponseUserJobSummaryResponse`)와 같다. 여기서 그 차이를 흡수한다.
 */
async function fetchJobPage(
  params: GetJobsParams,
): Promise<{ items: JobSummary[]; pageInfo: PageInfo }> {
  const response = (await getJobs(
    params,
  )) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;

  return (
    response.data ?? {
      items: [],
      pageInfo: {
        pageNum: params.page ?? 1,
        pageSize: params.size ?? 10,
        totalElements: 0,
        totalPages: 0,
      },
    }
  );
}

/** 채용공고 목록을 카드로 렌더링한다. 빈 목록이면 빈 상태 문구를 보여준다. */
export async function JobList({ page, sort }: JobListProps) {
  const { items, pageInfo } = await fetchJobPage({ page, sort });

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <SortToggle sort={sort} />
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
