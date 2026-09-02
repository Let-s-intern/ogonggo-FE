/**
 * 스냅샷 시점의 수집 현황. `packages/api/src/mocks/fixtures/real-jobs-seed.ts` 헤더에 적힌
 * 2026-08-31 크롤러 운영 DB 스냅샷 기준이다.
 *
 * 실시간 값이 아니다. 그래서 문구를 "지금까지"로 적어 라이브 카운터처럼 읽히지 않게 한다.
 * 스냅샷을 다시 뜨면 여기 숫자도 같이 고친다.
 */
export const COLLECTED = {
  companies: 118,
  postings: 696,
  snapshotDate: '2026-08-31',
} as const;
