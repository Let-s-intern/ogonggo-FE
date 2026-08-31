import Link from 'next/link';
import { computeDday } from '@/entities/job/model/dday';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
import type { JobSummary } from '@/entities/job/model/types';

export interface PopularJobCardProps {
  job: JobSummary;
}

/**
 * `home.png`의 "인기 공고" 카드 — `widgets/job-list/ui/JobList.tsx`의 "전체 공고" 그리드 카드와
 * 같은 `JobThumbnail`(D-day 배지가 썸네일 위에 얹힌다)을 그대로 써서 두 섹션의 카드 디자인을
 * 통일한다. "직무" 세그먼트는 대응 API 필드가 없어 뺀다(PRD 10절).
 */
export function PopularJobCard({ job }: PopularJobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`} className="flex flex-col gap-2">
      <JobThumbnail
        bookmarked={job.bookmarked}
        dday={computeDday(job.recruitmentType, job.recruitmentEndAt)}
      />
      <p className="text-sm text-gray-500">{job.companyName}</p>
      <p className="line-clamp-2 text-sm font-bold text-gray-900">{job.title}</p>
    </Link>
  );
}
