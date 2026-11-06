import {
  listPublicJobs,
  type SuccessResponsePageResponseUserJobSummaryResponse,
} from '@ogonggo/api';

/** 이 시간 안에 응답이 없으면 숫자 없이 그린다. 홈 전체가 이 요청 하나를 기다리지 않게 한다. */
const TIMEOUT_MS = 3000;

/**
 * 홈 히어로 `채용공고가 NN개 올라왔어요` 의 NN.
 *
 * **지금 모집 중인 공고 수**다 — 필터 없는 `GET /api/v1/jobs?size=1` 의 `pageInfo.totalElements`. `recruitmentStatus`
 * 를 보내지 않으면 백엔드가 RECRUITING 으로 보고 마감 공고를 뺀다(생성 함수 `listPublicJobs` 설명). 사용자 API 에는
 * "오늘 올라온 공고" 를 셀 길이 없다: 목록에 등록일 필터가 없고, `GET /api/v1/jobs/today` 는 운영자가 고른 오공고
 * PICK 이라 오늘 등록한 공고가 아니다. 그래서 지원할 수 있는 공고 전체를 센다. 아래 `전체 공고` 목록이 필터 없이
 * 보이는 건수와 같은 숫자라 화면 안에서 어긋나지 않는다(2026-11-06, 이슈 #573).
 *
 * 실패하거나 늦으면 `null` 이고 헤드라인은 숫자 없는 문구다. 이 숫자 하나 때문에 홈이 `(site)/error.tsx` 로 바뀌면
 * 안 된다. 다만 삼킨 오류는 서버 로그에 남긴다(`widgets/popular-jobs/api/fetchTodayJobs.ts` 와 같다).
 */
export async function fetchRecruitingJobCount(): Promise<number | null> {
  try {
    const response = (await listPublicJobs(
      { size: 1 },
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    )) as unknown as SuccessResponsePageResponseUserJobSummaryResponse;
    return response.data?.pageInfo.totalElements ?? null;
  } catch (error) {
    console.error('[hero-job-count] 공고 수를 받지 못해 숫자 없이 그립니다.', error);
    return null;
  }
}
