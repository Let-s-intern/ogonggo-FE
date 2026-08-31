import type { JobRecruitmentType } from './types';

/**
 * 마감까지 남은 일수. 상시채용·마감일 없음·이미 지난 마감이면 `null`(배지 자체를 숨긴다,
 * "D--3" 같은 표기는 목업에 없다).
 */
export function computeDaysRemaining(
  recruitmentType: JobRecruitmentType,
  recruitmentEndAt?: string,
): number | null {
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

  return diffDays < 0 ? null : diffDays;
}

/** `recruitmentEndAt` 기준 D-day 문구. */
export function computeDday(
  recruitmentType: JobRecruitmentType,
  recruitmentEndAt?: string,
): string | null {
  const diffDays = computeDaysRemaining(recruitmentType, recruitmentEndAt);
  if (diffDays === null) {
    return null;
  }
  return diffDays === 0 ? 'D-DAY' : `D-${diffDays}`;
}

/** 마감까지 하루 이하로 남았으면(D-DAY·D-1) 급함 — Figma의 두 배지 색 기준(D-1 주황 / D-10 파랑). */
export function isDdayUrgent(recruitmentType: JobRecruitmentType, recruitmentEndAt?: string): boolean {
  const diffDays = computeDaysRemaining(recruitmentType, recruitmentEndAt);
  return diffDays !== null && diffDays <= 1;
}
