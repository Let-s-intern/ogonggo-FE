import Link from 'next/link';
import { computeDday } from '../model/dday';
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
 * 썸네일(북마크만) → "고용형태 · 경력  D-day" 한 줄 → "회사명 · 지역" 한 줄 → 제목.
 */
export function JobCard({ job }: JobCardProps) {
  const dday = computeDday(job.recruitmentType, job.recruitmentEndAt);

  return (
    <Link href={`/jobs/${job.id}`} className="flex flex-col gap-2">
      <JobThumbnail companyName={job.companyName} bookmarked={job.bookmarked} />
      <p className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {EMPLOYMENT_TYPE_LABELS[job.employmentType]} · {EXPERIENCE_TYPE_LABELS[job.experienceType]}
        </span>
        {dday ? <span className="font-semibold text-gray-900">{dday}</span> : null}
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
