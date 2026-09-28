import { parseLocalDate } from './localDate';

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

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 한국 시간으로 오늘인 날짜를 `Date.UTC` 자정 값으로 돌려준다.
 *
 * `new Date()` 의 연·월·일은 실행하는 쪽 시간대를 따른다. 서버 컴포넌트는 Vercel(UTC)에서 그려서
 * 한국 시간 0시~9시에는 아직 어제라, D-day 가 하루 크게 나오고 마감 당일이 `D-1` 로 보였다.
 * 지금 순간에 9시간을 더한 뒤 UTC 로 읽으면 어디서 그리든 한국의 오늘이 나온다.
 */
function todayInKst(): number {
  const kst = new Date(Date.now() + KST_OFFSET_MS);
  return Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
}

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

  // 사이드·스터디는 시각 없는 날짜가 온다 — 시간대 없이 읽는다(`./localDate.ts`). 마감 일시도
  // 시간대 없는 `LocalDateTime` 이라 어디서 읽든 적힌 날짜 그대로다. 오늘만 한국 시간으로 맞춘다.
  const end = parseLocalDate(recruitmentEndAt);
  const diffDays = Math.ceil(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - todayInKst()) /
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

/**
 * 마감된 건인가. `closedAt`이 찍혔거나, 기간 채용인데 마감일이 이미 지났으면 마감이다.
 *
 * `computeDday`가 `null`을 돌려주는 경우는 셋인데(상시채용, 마감일 없음, 지난 마감) 그중
 * 마지막 하나만 마감이다. 배지 자리에 `마감`을 넣을지 아무것도 넣지 않을지가 이걸로 갈린다.
 */
export function isRecruitmentClosed(
  recruitmentType: RecruitmentType,
  recruitmentEndAt?: string,
  closedAt?: string,
): boolean {
  if (closedAt) {
    return true;
  }
  if (recruitmentType === 'ALWAYS_OPEN' || !recruitmentEndAt) {
    return false;
  }
  return computeDaysRemaining(recruitmentType, recruitmentEndAt) === null;
}

/** 마감까지 하루 이하로 남았으면(D-DAY·D-1) 급함 — Figma의 두 배지 색 기준(D-1 주황 / D-10 파랑). */
export function isDdayUrgent(recruitmentType: RecruitmentType, recruitmentEndAt?: string): boolean {
  const diffDays = computeDaysRemaining(recruitmentType, recruitmentEndAt);
  return diffDays !== null && diffDays <= 1;
}
