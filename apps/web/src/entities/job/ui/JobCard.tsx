import Link from 'next/link';
import { Badge } from '@ogonggo/ui';
import { computeDday, isDdayUrgent } from '../model/dday';
import { getJobMajor } from '../model/job-major';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '../model/labels';
import type { JobSummary } from '../model/types';
import { JobMeta } from './JobMeta';
import { JobThumbnail } from './JobThumbnail';

export interface JobCardProps {
  job: JobSummary;
}

/**
 * "인기 공고"와 "전체 공고" 두 섹션이 완전히 같은 카드 디자인을 쓰도록 만든 단일 컴포넌트다
 * (`widgets/job-list/ui/JobList.tsx`와 `widgets/popular-jobs/ui/PopularJobCard.tsx`가 예전엔
 * 따로 그려서 D-day 표시 방식이 서로 달랐다 — 사용자가 그 차이를 지적해 하나로 합쳤다).
 * 썸네일(북마크만) → "고용형태 · 직무 · 경력  D-day 배지" 한 줄 → "회사명 · 지역" 한 줄 → 제목.
 * "직무"(`job_major`)는 처음엔 대응 API 필드가 없다고 뺐었는데, 실제 목업(`상세 채용공고.png`
 * 리스트 카드 크롭)을 다시 보니 있었다 — 크롤러 DB엔 이 필드가 실제로 있어서(`job-major.ts`)
 * 넣는다, 없는 공고는 그 세그먼트만 뺀다.
 */
export function JobCard({ job }: JobCardProps) {
  const dday = computeDday(job.recruitmentType, job.recruitmentEndAt);
  const urgent = isDdayUrgent(job.recruitmentType, job.recruitmentEndAt);
  const jobMajor = getJobMajor(job.id);
  const metaParts = [
    EMPLOYMENT_TYPE_LABELS[job.employmentType],
    jobMajor,
    EXPERIENCE_TYPE_LABELS[job.experienceType],
  ].filter((part): part is string => Boolean(part));

  return (
    <Link href={`/jobs/${job.id}`} className="flex flex-col gap-2">
      <JobThumbnail companyName={job.companyName} bookmarked={job.bookmarked} />
      <p className="flex items-center justify-between text-xs text-gray-400">
        <span>{metaParts.join(' · ')}</span>
        {dday ? (
          <Badge
            tone={urgent ? 'urgent' : 'main'}
            className="rounded-full px-3 py-1.5 text-base font-bold"
          >
            {dday}
          </Badge>
        ) : null}
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
  );
}
