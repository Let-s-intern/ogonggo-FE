/**
 * 모집 마감 D-day 계산. 원래 `entities/job/model/dday.ts`였는데 채용공고 전용이 아니어서
 * 여기로 옮겼다 — 부트캠프(`entities/bootcamp`)도 같은 계산을 쓴다. 계산은 그대로다.
 *
 * `shared`는 이 앱의 다른 레이어를 임포트하지 않으므로(`shared/README.md`) 원래
 * `entities/job/model/types.ts`의 `JobRecruitmentType`이던 인자 타입을 아래 `RecruitmentType`
 * 리터럴 유니온으로 바꿨다. 채용공고와 부트캠프의 생성 타입(`UserJobSummaryResponse
 * ['recruitmentType']`, `UserBootcampSummaryResponse['recruitmentType']`)이 둘 다 같은
 * `'PERIOD' | 'ALWAYS_OPEN'`이라 호출부는 그대로 통과한다.
 */
export type RecruitmentType = 'PERIOD' | 'ALWAYS_OPEN';

/**
 * 마감까지 남은 일수. 상시채용·마감일 없음·이미 지난 마감이면 `null`(배지 자체를 숨긴다,
 * "D--3" 같은 표기는 목업에 없다).
 */
export function computeDaysRemaining(
  recruitmentType: RecruitmentType,
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
  recruitmentType: RecruitmentType,
  recruitmentEndAt?: string,
): string | null {
  const diffDays = computeDaysRemaining(recruitmentType, recruitmentEndAt);
  if (diffDays === null) {
    return null;
  }
  return diffDays === 0 ? 'D-DAY' : `D-${diffDays}`;
}

/** 마감까지 하루 이하로 남았으면(D-DAY·D-1) 급함 — Figma의 두 배지 색 기준(D-1 주황 / D-10 파랑). */
export function isDdayUrgent(
  recruitmentType: RecruitmentType,
  recruitmentEndAt?: string,
): boolean {
  const diffDays = computeDaysRemaining(recruitmentType, recruitmentEndAt);
  return diffDays !== null && diffDays <= 1;
}
