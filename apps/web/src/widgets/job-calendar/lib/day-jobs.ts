/**
 * 월간 오른쪽 목록이 한 번에 불러오는 수. 처음 5건을 보이고 `더보기`가 5건씩 늘린다
 * (`docs/asset/v6 공고달력/월간 보기.png`). 서버 함수(`../api/load-day-jobs.ts`)는 상수를 내보낼
 * 수 없어서 여기 둔다.
 */
export const DAY_JOBS_PAGE_SIZE = 5;
