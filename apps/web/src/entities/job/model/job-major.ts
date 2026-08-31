import { REAL_JOB_SEEDS } from '@ogonggo/api/src/mocks/fixtures/real-jobs-seed';

/**
 * 공고 id → 직무 카테고리(`job_major`, 예: "마케팅·광고"). `UserJobSummaryResponse`엔 이
 * 필드가 없다(실제 API 계약에 없는 필드를 타입에 끼워 넣지 않는다) — 카드 메타 줄 표시에만
 * `REAL_JOB_SEEDS`에서 직접 찾아 쓴다. 크롤러가 분류 못 한 공고(672/696건만 있음)나 5개
 * 이름 붙은 시나리오 픽스처(id 1~5)는 여기 없고, `getJobMajor`가 `undefined`를 돌려주면
 * 호출 쪽에서 그 세그먼트를 그냥 뺀다 — 지어내지 않는다.
 */
const JOB_MAJOR_BY_ID: Record<number, string> = (() => {
  const map: Record<number, string> = {};
  for (const seed of REAL_JOB_SEEDS) {
    if (seed.jobMajor) {
      map[seed.fixtureId] = seed.jobMajor;
    }
  }
  return map;
})();

export function getJobMajor(jobId: number): string | undefined {
  return JOB_MAJOR_BY_ID[jobId];
}
