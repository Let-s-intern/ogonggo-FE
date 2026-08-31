import Link from 'next/link';
import { computeDday } from '@/entities/job/model/dday';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
import type { JobSummary } from '@/entities/job/model/types';

export interface PopularJobCardProps {
  job: JobSummary;
}

/**
 * `home.png`의 "인기 공고" 카드. 썸네일 아래 첫 줄은 "직무 ... D-day" 형태의 평문 텍스트인데,
 * "직무"는 대응 API 필드가 없어 뺀다(PRD 10절) — D-day만 오른쪽 정렬로 남는다. D-day는 배지가
 * 아니라 평문이다(목업 실측 — 배지는 상세 페이지 헤더에만 쓴다).
 */
export function PopularJobCard({ job }: PopularJobCardProps) {
  const dday = computeDday(job.recruitmentType, job.recruitmentEndAt);

  return (
    <Link href={`/jobs/${job.id}`} className="flex flex-col gap-2">
      <JobThumbnail bookmarked={job.bookmarked} />
      {dday ? <p className="text-right text-xs font-semibold text-gray-900">{dday}</p> : null}
      <p className="text-sm text-gray-500">{job.companyName}</p>
      <p className="line-clamp-2 text-sm font-bold text-gray-900">{job.title}</p>
    </Link>
  );
}
