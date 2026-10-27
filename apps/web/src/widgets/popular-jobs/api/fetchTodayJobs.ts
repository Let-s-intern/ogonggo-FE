import {
  listPublicTodayJobs,
  type SuccessResponseListUserTodayJobSummaryResponse,
  type UserTodayJobSummaryResponse,
} from '@ogonggo/api';
import { isRecruitmentClosed } from '@/shared/lib/dday';

/** 이 시간 안에 응답이 없으면 인기 공고로 대신한다. 홈 전체가 이 요청 하나를 기다리지 않게 한다. */
const TIMEOUT_MS = 3000;

/**
 * 운영자가 고른 오늘의 공고(오공고 PICK)를 받는다. 생성 타입은 `{ data, status }` 로 감싸지만
 * `httpClient` 는 본문을 그대로 돌려준다.
 *
 * 실패하면 빈 목록이고, 히어로 첫 탭이 인기 공고로 바뀐다. 이 요청 하나 때문에 홈 본문 전체가
 * `(site)/error.tsx` 로 바뀌면 안 된다. 다만
 * 삼킨 오류가 보이지 않으면 백엔드가 계속 500 을 내도 아무도 모르므로 서버 로그에는 남긴다.
 *
 * 개수는 자르지 않는다 — 운영자가 고른 만큼 보이고 PC 는 네 건씩 넘긴다(`ui/PopularJobsTabs.tsx`).
 *
 * 마감 처리됐거나 마감일이 지난 공고는 뺀다. 백엔드 공개 API 는 운영자가 뺄 때까지 마감 공고도
 * 내려준다(`GET /api/v1/jobs/today` 설명). 카드의 `마감` 배지와 같은 기준(`isRecruitmentClosed`)이다.
 */
export async function fetchTodayJobs(): Promise<UserTodayJobSummaryResponse[]> {
  try {
    const response = (await listPublicTodayJobs({
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })) as unknown as SuccessResponseListUserTodayJobSummaryResponse;
    return (response.data ?? []).filter(
      (job) => !isRecruitmentClosed(job.recruitmentType, job.recruitmentEndAt, job.closedAt),
    );
  } catch (error) {
    console.error('[today-jobs] 오공고 PICK 을 받지 못해 인기 공고로 대신합니다.', error);
    return [];
  }
}
