import { Button, Card, CardTitle } from '@ogonggo/ui';
import { getJob } from '@ogonggo/api';
import type { SuccessResponseUserJobDetailResponse } from '@ogonggo/api';
import { JobBadge } from '@/entities/job/ui/JobBadge';
import { JobMeta } from '@/entities/job/ui/JobMeta';
import type { JobDetail } from '@/entities/job/model/types';

export interface JobDetailViewProps {
  jobId: number;
}

/**
 * `getJob`(packages/api/src/generated/user/endpoints.ts)의 선언 타입도
 * `widgets/job-list/ui/JobList.tsx`의 `fetchJobPage`와 같은 이유로 `{ data, status, headers }`로
 * 감싼 응답을 가정하지만, 이 저장소의 `httpClient`(packages/api/src/lib/http-client.ts)는 파싱된
 * body를 그대로 반환한다 — 여기서도 같은 방식으로 그 차이를 흡수한다.
 */
async function fetchJobDetail(jobId: number): Promise<JobDetail> {
  const response = (await getJob(jobId)) as unknown as SuccessResponseUserJobDetailResponse;

  if (!response.data) {
    throw new Error(`채용공고 상세 응답에 data가 없습니다: ${jobId}`);
  }

  return response.data;
}

function buildSections(job: JobDetail): { label: string; value?: string }[] {
  return [
    { label: '회사소개', value: job.companyAndTeamIntroduction },
    { label: '자격요건', value: job.qualifications },
    { label: '우대사항', value: job.preferredQualifications },
    { label: '보상', value: job.compensation },
    { label: '복지', value: job.benefits },
    { label: '채용절차', value: job.hiringProcess },
  ];
}

/** 채용공고 상세 — 헤더(제목·메타·배지)와 본문 섹션(값 있는 것만)을 보여준다. */
export async function JobDetailView({ jobId }: JobDetailViewProps) {
  const job = await fetchJobDetail(jobId);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
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
      {buildSections(job)
        .filter((section) => Boolean(section.value))
        .map((section) => (
          <Card key={section.label}>
            <CardTitle>{section.label}</CardTitle>
            <p className="whitespace-pre-line text-sm text-gray-700">{section.value}</p>
          </Card>
        ))}
      {job.sourceUrl ? (
        <Button asChild variant="secondary">
          <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
            원문 보기
          </a>
        </Button>
      ) : null}
    </div>
  );
}
