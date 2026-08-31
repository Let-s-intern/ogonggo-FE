import { Badge } from '@ogonggo/ui';
import type { JobEducationLevel, JobEmploymentType, JobExperienceType } from '../model/types';

const EMPLOYMENT_TYPE_LABELS: Record<JobEmploymentType, string> = {
  FULL_TIME: '정규직',
  CONTRACT: '계약직',
  INTERN: '인턴',
  PART_TIME: '파트타임',
  ETC: '기타',
};

const EXPERIENCE_TYPE_LABELS: Record<JobExperienceType, string> = {
  NEWCOMER: '신입',
  EXPERIENCED: '경력',
  BOTH: '경력무관',
  IRRELEVANT: '경력무관',
};

const EDUCATION_LEVEL_LABELS: Record<JobEducationLevel, string> = {
  ANY: '학력무관',
  HIGH_SCHOOL: '고졸',
  ASSOCIATE: '초대졸',
  BACHELOR: '대졸',
  MASTER: '석사',
  DOCTORATE: '박사',
};

export interface JobBadgeProps {
  employmentType: JobEmploymentType;
  experienceType: JobExperienceType;
  educationLevel: JobEducationLevel;
}

/** 고용형태·경력·학력을 pill 세 개로 보여준다. `Badge`(@ogonggo/ui) 재사용. */
export function JobBadge({ employmentType, experienceType, educationLevel }: JobBadgeProps) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge tone="main">{EMPLOYMENT_TYPE_LABELS[employmentType]}</Badge>
      <Badge tone="neutral">{EXPERIENCE_TYPE_LABELS[experienceType]}</Badge>
      <Badge tone="neutral">{EDUCATION_LEVEL_LABELS[educationLevel]}</Badge>
    </div>
  );
}
