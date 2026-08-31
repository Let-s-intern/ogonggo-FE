import type { JobRecruitmentType } from '../model/types';

export interface JobMetaProps {
  companyName: string;
  region?: string;
  recruitmentType: JobRecruitmentType;
  recruitmentEndAt?: string;
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
export function JobMeta({ companyName, region, recruitmentType, recruitmentEndAt }: JobMetaProps) {
  const parts = [companyName, region, formatDeadline(recruitmentType, recruitmentEndAt)].filter(
    (part): part is string => Boolean(part),
  );

  return <p className="flex items-center gap-2 text-sm text-gray-500">{parts.join(' · ')}</p>;
}
