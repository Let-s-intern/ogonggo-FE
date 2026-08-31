import Link from 'next/link';
import { JobDday } from '@/entities/job/ui/JobDday';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
import type { JobSummary } from '@/entities/job/model/types';

export interface PopularJobCardProps {
  job: JobSummary;
}

/**
 * `home.png`의 "인기 공고" 카드 — 회색 placeholder, D-day, 회사명, 제목, 북마크만
 * (2.2절). "직무" 세그먼트는 대응 API 필드가 없어 뺀다(PRD 10절).
 */
export function PopularJobCard({ job }: PopularJobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`} className="flex flex-col gap-2">
      <JobThumbnail bookmarked={job.bookmarked} />
      <div className="flex justify-end">
        <JobDday recruitmentType={job.recruitmentType} recruitmentEndAt={job.recruitmentEndAt} />
      </div>
      <p className="text-sm text-gray-500">{job.companyName}</p>
      <p className="line-clamp-2 text-sm font-bold text-gray-900">{job.title}</p>
    </Link>
  );
}
