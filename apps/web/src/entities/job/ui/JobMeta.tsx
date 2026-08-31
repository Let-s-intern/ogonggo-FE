import type { JobRecruitmentType } from '../model/types';

export interface JobMetaProps {
  companyName: string;
  region?: string;
  recruitmentType: JobRecruitmentType;
  recruitmentEndAt?: string;
  /** 그리드 카드처럼 D-day 배지가 이미 마감을 보여주는 곳에서는 이 줄에서 마감 문구를 뺀다. */
  showDeadline?: boolean;
}

function formatDeadline(recruitmentType: JobRecruitmentType, recruitmentEndAt?: string): string {
  if (recruitmentType === 'ALWAYS_OPEN') {
    return '상시채용';
  }
  if (!recruitmentEndAt) {
    return '마감일 미정';
  }
  const date = new Date(recruitmentEndAt);
  return `~${date.getMonth() + 1}.${date.getDate()} 마감`;
}

/** 회사명·지역·마감을 한 줄로 보여준다. region이 없으면(noRegion 시나리오) 지역을 건너뛴다. */
export function JobMeta({
  companyName,
  region,
  recruitmentType,
  recruitmentEndAt,
  showDeadline = true,
}: JobMetaProps) {
  const parts = [
    companyName,
    region,
    showDeadline ? formatDeadline(recruitmentType, recruitmentEndAt) : null,
  ].filter((part): part is string => Boolean(part));

  return <p className="flex items-center gap-2 text-sm text-gray-500">{parts.join(' · ')}</p>;
}
