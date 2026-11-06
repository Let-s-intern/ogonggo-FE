import {
  getPublicJobHeadlineCount,
  type SuccessResponseUserJobHeadlineCountResponse,
} from '@ogonggo/api';

/** 이 시간 안에 응답이 없으면 숫자 없이 그린다. 홈 전체가 이 요청 하나를 기다리지 않게 한다. */
const TIMEOUT_MS = 3000;

/**
 * 홈 히어로 `채용공고가 NN개 올라왔어요` 의 비로그인 NN, 즉 **오늘(서울 0시부터) 올라온 모집 중 공고 수**다
 * (`GET /api/v1/jobs/headline-count`, 이슈 #581). 서버에는 토큰이 없어 언제나 비로그인 숫자를 받는다. 로그인한
 * 사람의 희망 직무 숫자는 브라우저가 따로 받는다(`ui/JobsHeroHeadline.tsx`).
 *
 * 실패하거나 늦으면 `null` 이고 헤드라인은 숫자 없는 문구다. 이 숫자 하나 때문에 홈이 `(site)/error.tsx` 로 바뀌면
 * 안 된다. 다만 삼킨 오류는 서버 로그에 남긴다(`widgets/popular-jobs/api/fetchTodayJobs.ts` 와 같다).
 */
export async function fetchHeadlineJobCount(): Promise<number | null> {
  try {
    const response = (await getPublicJobHeadlineCount({
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })) as unknown as SuccessResponseUserJobHeadlineCountResponse;
    return response.data?.count ?? null;
  } catch (error) {
    console.error('[hero-job-count] 공고 수를 받지 못해 숫자 없이 그립니다.', error);
    return null;
  }
}
