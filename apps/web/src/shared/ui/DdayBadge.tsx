import { cn } from '@ogonggo/ui';
import { computeDday, isDdayUrgent, type RecruitmentType } from '@/shared/lib/dday';

export interface DdayBadgeProps {
  recruitmentType: RecruitmentType;
  recruitmentEndAt?: string;
}

/**
 * 상세 페이지 헤더의 D-day 배지 — `Badge`(`@ogonggo/ui`)와 달리 완전히 둥글고 더 굵어서
 * 재사용하지 않고 여기서 직접 그린다. 마감이 하루 이하로 남으면(D-DAY/D-1) 주황, 그보다 여유
 * 있으면 파랑이다 — 색은 둘 다 목업이 실제로 쓰는 정확한 팔레트다.
 *
 * 크기는 옆의 마감일시 문구와 같은 `text-base` 기준이다. 한때 `text-2xl px-6 py-3`으로 훨씬
 * 크게 그렸는데 목업(`상세 채용공고.png`)에선 마감 문구와 거의 같은 높이의 작은 알약이다.
 *
 * 원래 `entities/job/ui/JobDday.tsx`였다. 부트캠프 상세 헤더(`widgets/bootcamp-detail`)가 같은
 * 배지를 쓰게 되어(`교육부트캠프 상세페이지.png`의 `D-5`) `shared/lib/dday.ts`가 옮겨온 것과
 * 같은 이유로 여기로 옮겼다 — 그림은 그대로다.
 */
export function DdayBadge({ recruitmentType, recruitmentEndAt }: DdayBadgeProps) {
  const dday = computeDday(recruitmentType, recruitmentEndAt);
  if (!dday) {
    return null;
  }
  const urgent = isDdayUrgent(recruitmentType, recruitmentEndAt);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-3.5 py-1 text-base font-extrabold',
        urgent ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-600',
      )}
    >
      {dday}
    </span>
  );
}
