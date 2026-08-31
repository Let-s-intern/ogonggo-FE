import { cn } from '@ogonggo/ui';
import { computeDday, isDdayUrgent } from '../model/dday';
import type { JobRecruitmentType } from '../model/types';

export interface JobDdayProps {
  recruitmentType: JobRecruitmentType;
  recruitmentEndAt?: string;
}

/**
 * 상세 페이지 헤더의 큰 D-day 배지 — Figma 실측(피그마 노드 29582-2728) 결과 목록 카드의 작은
 * `Badge`(`@ogonggo/ui`)보다 크고 진하고 완전히 둥근 전용 스타일이라 그 컴포넌트를 재사용하지
 * 않고 여기서 직접 그린다. 마감이 하루 이하로 남으면(D-DAY/D-1) 주황, 그보다 여유 있으면
 * 파랑이다 — 색은 둘 다 목업이 실제로 쓰는 정확한 팔레트다.
 */
export function JobDday({ recruitmentType, recruitmentEndAt }: JobDdayProps) {
  const dday = computeDday(recruitmentType, recruitmentEndAt);
  if (!dday) {
    return null;
  }
  const urgent = isDdayUrgent(recruitmentType, recruitmentEndAt);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-6 py-3 text-2xl font-extrabold',
        urgent ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-600',
      )}
    >
      {dday}
    </span>
  );
}
