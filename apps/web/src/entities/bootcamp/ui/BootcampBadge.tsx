import { Badge } from '@ogonggo/ui';
import { computeDday, isDdayUrgent } from '@/shared/lib/dday';
import { STATUS_LABELS } from '../model/labels';
import type { BootcampSummary } from '../model/types';

export interface BootcampBadgeProps {
  recruitmentType: BootcampSummary['recruitmentType'];
  recruitmentEndAt?: string;
  status: BootcampSummary['status'];
}

/**
 * 목업의 배지는 두 종류다 — 마감이 임박하면 D-day(주황), 아니면 `모집 중`(파랑). 마감된 건은
 * 목업에 없지만 픽스처에 있고(`status: CLOSED`) 그때는 회색 `마감`이다.
 *
 * 목록 카드(`BootcampCard`)와 상세 사이드바의 `비슷한 교육`이 같은 배지를 쓴다 — 카드 안에
 * 있던 것을 그대로 꺼냈고 그림은 바뀌지 않았다.
 */
export function BootcampBadge({ recruitmentType, recruitmentEndAt, status }: BootcampBadgeProps) {
  if (status !== 'RECRUITING') {
    return (
      <Badge tone="neutral" className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold">
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  const dday = computeDday(recruitmentType, recruitmentEndAt);
  const urgent = isDdayUrgent(recruitmentType, recruitmentEndAt);

  return (
    <Badge
      tone={urgent ? 'urgent' : 'main'}
      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
    >
      {urgent && dday ? dday : STATUS_LABELS.RECRUITING}
    </Badge>
  );
}
