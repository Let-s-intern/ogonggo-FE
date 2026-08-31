import { notFound } from 'next/navigation';
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

/**
 * `상세 채용공고.png`가 실제로 쓰는 6개 라벨(띄어쓰기 포함) 그대로다 — "회사소개"는 이
 * 목업에 섹션으로 없다(헤더의 회사명 한 줄이 전부). 최초 AC 문구가 7개 본문 필드 중
 * `companyAndTeamIntroduction`을 포함하고 `responsibilities`를 빠뜨렸던 건 목업과 어긋난
 * 오기였다 — 목업을 기준으로 바로잡는다.
 */
function buildSections(job: JobDetail): { label: string; value?: string }[] {
  return [
    { label: '주요 업무', value: job.responsibilities },
    { label: '자격 요건', value: job.qualifications },
    { label: '우대 사항', value: job.preferredQualifications },
    { label: '급여 및 처우', value: job.compensation },
    { label: '혜택 및 복지', value: job.benefits },
    { label: '채용 절차', value: job.hiringProcess },
  ];
}

/**
 * 채용공고 상세 — `docs/asset/상세 채용공고.png` 순서(헤더 카드 → 정보 그리드 → 본문 섹션
 * (값 있는 것만) → 사이드바)로 조합한다. 본문(왼쪽)과 사이드바(오른쪽)는 데스크톱에서 2단,
 * 좁은 화면에서는 세로로 쌓인다.
 */
export async function JobDetailView({ jobId }: JobDetailViewProps) {
  const job = await fetchJobDetail(jobId);

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4">
      <JobDetailBreadcrumb />
      <JobDetailHeaderCard
        companyName={job.companyName}
        region={job.region}
        title={job.title}
        recruitmentType={job.recruitmentType}
        recruitmentEndAt={job.recruitmentEndAt}
        viewCount={job.viewCount}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <JobInfoGrid
            experienceType={job.experienceType}
            employmentType={job.employmentType}
            educationLevel={job.educationLevel}
            region={job.region}
          />
          {buildSections(job)
            .filter((section) => Boolean(section.value))
            .map((section) => (
              <div key={section.label}>
                <h2 className="text-lg font-bold text-gray-900">{section.label}</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{section.value}</p>
              </div>
            ))}
        </div>
        <aside className="flex flex-col gap-6">
          <JobApplyCta
            sourceUrl={job.sourceUrl}
            bookmarked={job.bookmarked}
            bookmarkCount={job.bookmarkCount}
          />
          <SimilarJobs excludeJobId={job.id} />
          <CrossSellWidget />
        </aside>
      </div>
    </div>
  );
}
