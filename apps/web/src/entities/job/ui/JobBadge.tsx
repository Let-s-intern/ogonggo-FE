import { Badge } from '@ogonggo/ui';
import {
  EDUCATION_LEVEL_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_TYPE_LABELS,
} from '../model/labels';
import type { JobEducationLevel, JobEmploymentType, JobExperienceType } from '../model/types';

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
