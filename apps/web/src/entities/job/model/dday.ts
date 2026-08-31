import type { JobRecruitmentType } from './types';

/**
 * `recruitmentEndAt` 기준 D-day 문구. 상시채용이거나 마감일이 없으면(`null`) 배지 자체를 숨긴다.
 * 이미 지난 마감일도 숨긴다 — "D--3" 같은 표기는 목업에 없다.
 */
export function computeDday(
  recruitmentType: JobRecruitmentType,
  recruitmentEndAt?: string,
): string | null {
  if (recruitmentType === 'ALWAYS_OPEN' || !recruitmentEndAt) {
    return null;
  }

  const end = new Date(recruitmentEndAt);
  const now = new Date();
  const diffDays = Math.ceil(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return null;
  }
  return diffDays === 0 ? 'D-DAY' : `D-${diffDays}`;
}
