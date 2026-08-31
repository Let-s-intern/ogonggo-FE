import { Badge } from '@ogonggo/ui';
import { computeDday } from '../model/dday';
import type { JobRecruitmentType } from '../model/types';

export interface JobDdayProps {
  recruitmentType: JobRecruitmentType;
  recruitmentEndAt?: string;
}

/** D-day 배지. 상시채용·마감일 없음·이미 마감이면 아무것도 렌더링하지 않는다. */
export function JobDday({ recruitmentType, recruitmentEndAt }: JobDdayProps) {
  const dday = computeDday(recruitmentType, recruitmentEndAt);
  if (!dday) {
    return null;
  }
  return (
    <Badge tone="urgent" className="shrink-0">
      {dday}
    </Badge>
  );
}
