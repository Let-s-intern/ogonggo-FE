import { notFound } from 'next/navigation';
import { Card, CardTitle } from '@ogonggo/ui';
import { getJob } from '@ogonggo/api';
import type { SuccessResponseUserJobDetailResponse } from '@ogonggo/api';
import type { JobDetail } from '@/entities/job/model/types';
import { CrossSellWidget } from './CrossSellWidget';
import { JobApplyCta } from './JobApplyCta';
import { JobDetailBreadcrumb } from './JobDetailBreadcrumb';
import { JobDetailHeaderCard } from './JobDetailHeaderCard';
import { JobInfoGrid } from './JobInfoGrid';
import { SimilarJobs } from './SimilarJobs';

export interface JobDetailViewProps {
  jobId: number;
}

/**
 * `getJob`(packages/api/src/generated/user/endpoints.ts)의 선언 타입도
 * `widgets/job-list/ui/JobList.tsx`의 `fetchJobPage`와 같은 이유로 `{ data, status, headers }`로
 * 감싼 응답을 가정하지만, 이 저장소의 `httpClient`(packages/api/src/lib/http-client.ts)는 파싱된
 * body를 그대로 반환한다 — 여기서도 같은 방식으로 그 차이를 흡수한다.
 *
 * 404(JOB_NOT_FOUND)는 `httpClient`가 구조화된 응답 대신
 * `Error("GET /api/v1/jobs/{id} failed: 404")`를 던지므로(응답이 `ok`가 아니면 무조건 던짐),
 * 메시지 끝의 상태 코드로 404를 가려내 `notFound()`(node_modules/next/dist/docs/01-app/
 * 03-api-reference/04-functions/not-found.md)로 변환한다. 그 외 오류(전송 실패 등)는 그대로
 * 다시 던진다.
 */
async function fetchJobDetail(jobId: number): Promise<JobDetail> {
  let response: SuccessResponseUserJobDetailResponse;
  try {
    response = (await getJob(jobId)) as unknown as SuccessResponseUserJobDetailResponse;
  } catch (error) {
    if (error instanceof Error && error.message.endsWith(': 404')) {
      notFound();
    }
    throw error;
  }

  if (!response.data) {
    notFound();
  }

  return response.data;
}

function buildSections(job: JobDetail): { label: string; value?: string }[] {
  return [
    { label: '회사소개', value: job.companyAndTeamIntroduction },
    { label: '주요업무', value: job.responsibilities },
    { label: '자격요건', value: job.qualifications },
    { label: '우대사항', value: job.preferredQualifications },
    { label: '보상', value: job.compensation },
    { label: '복지', value: job.benefits },
    { label: '채용절차', value: job.hiringProcess },
  ];
}

/** 채용공고 상세 — breadcrumb, 회사 정보 헤더, 본문 섹션(값 있는 것만)을 보여준다. */
export async function JobDetailView({ jobId }: JobDetailViewProps) {
  const job = await fetchJobDetail(jobId);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <JobDetailBreadcrumb />
      <JobDetailHeaderCard
        companyName={job.companyName}
        region={job.region}
        title={job.title}
        recruitmentType={job.recruitmentType}
        recruitmentEndAt={job.recruitmentEndAt}
        viewCount={job.viewCount}
      />
      <JobInfoGrid
        experienceType={job.experienceType}
        employmentType={job.employmentType}
        educationLevel={job.educationLevel}
        region={job.region}
      />
      {buildSections(job)
        .filter((section) => Boolean(section.value))
        .map((section) => (
          <Card key={section.label}>
            <CardTitle>{section.label}</CardTitle>
            <p className="whitespace-pre-line text-sm text-gray-700">{section.value}</p>
          </Card>
        ))}
      <JobApplyCta sourceUrl={job.sourceUrl} bookmarked={job.bookmarked} bookmarkCount={job.bookmarkCount} />
      <SimilarJobs excludeJobId={job.id} />
      <CrossSellWidget />
    </div>
  );
}
