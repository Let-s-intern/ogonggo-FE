import { useQueryClient } from '@tanstack/react-query';
import {
  listTodayJobs,
  type AdminTodayJobSummaryResponse,
  type ReplaceAdminTodayJobsRequest,
} from '@ogonggo/api/src/admin';
import { TODAY_JOBS_QUERY_KEY } from '@/entities/today-job/api/useTodayJobs';
import { unwrapData } from '@/shared/api/unwrapData';
import type { RecommendationValue } from './validate';

/** 서버가 준 한 건을 `PUT` 본문의 한 건으로. 다른 곳에서 정한 문구를 그대로 둔다. */
const toRequestJob = (job: AdminTodayJobSummaryResponse) => ({
  jobId: job.id,
  recommendationTitle: job.recommendationTitle,
  recommendationDescription: job.recommendationDescription,
});

/**
 * 오늘의 공고에 한 건을 더하고 빼고 문구를 바꾸는 쓰기.
 *
 * 한 건만 더하고 빼는 API 가 없고 `PUT` 이 목록을 통째로 바꾼다(배열 순서가 곧 노출 순서라 서버가
 * 순위를 따로 정하지 않는다). 그래서 보내기 직전에 목록을
 * 다시 받아 그 위에서 더하고 뺀다. 화면이 들고 있는 목록(오래됐을 수 있다)으로 보내면 다른
 * 운영자가 그 사이에 한 일을 덮어쓴다. 확인과 전송 사이의 틈은 남는다.
 *
 * `replace` 는 쓰는 쪽이 넘긴다. 채용공고 목록은 행마다 이 훅을 쓰면서 `useReplaceTodayJobs` 하나를
 * 화면에 두고 요청 중 표시(어느 행이든 PICK 을 못 바꾸게 한다)를 거기서 읽는다.
 *
 * 모든 함수는 실패하면 던진다. 문구는 쓰는 쪽이 정한다.
 */
export function useTodayJobWriter(
  replace: (input: ReplaceAdminTodayJobsRequest) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  /**
   * 오늘의 공고를 지금 서버 기준으로 다시 받는다. 캐시에 신선한 값이 있어도 쓰지 않는다.
   *
   * 쿼리 키와 요청은 `useTodayJobList`(`entities/today-job/api/useTodayJobs.ts`)와 같다. 같은
   * 키라 화면의 토글도 이 응답으로 바로 맞춰진다.
   */
  const fetchLatest = async (): Promise<AdminTodayJobSummaryResponse[]> => {
    const latest = await queryClient.fetchQuery({
      queryKey: TODAY_JOBS_QUERY_KEY,
      queryFn: () => unwrapData(listTodayJobs()),
      staleTime: 0,
    });
    if (!latest) {
      throw new Error('오늘의 공고 응답에 목록이 없다.');
    }
    return latest;
  };

  return {
    /**
     * 입력한 문구로 `jobId` 를 맨 앞(1순위)에 넣어 저장한다. 기존 공고는 한 칸씩 밀린다.
     *
     * 이미 들어 있으면 보내지 않고 `'exists'` 를 돌려준다. 다른 곳에서 먼저 켠 쪽의 문구를
     * 덮어쓰지 않는다.
     */
    add: async (jobId: number, value: RecommendationValue): Promise<'added' | 'exists'> => {
      const latest = await fetchLatest();
      if (latest.some((item) => item.id === jobId)) {
        return 'exists';
      }
      await replace({
        jobs: [
          {
            jobId,
            // 서버에는 앞뒤 공백을 뺀 문구를 보낸다. 검증이 그 길이로 판정했다.
            recommendationTitle: value.title.trim(),
            recommendationDescription: value.description.trim(),
          },
          ...latest.map(toRequestJob),
        ],
      });
      return 'added';
    },

    /**
     * `jobId` 를 뺀 목록으로 보낸다.
     *
     * 이미 빠져 있으면 보내지 않고 `'absent'` 를 돌려준다. 목록은 방금 받았으므로 화면의 토글이 그에
     * 맞춰진다.
     */
    remove: async (jobId: number): Promise<'removed' | 'absent'> => {
      const latest = await fetchLatest();
      if (!latest.some((item) => item.id === jobId)) {
        return 'absent';
      }
      await replace({
        jobs: latest.filter((item) => item.id !== jobId).map(toRequestJob),
      });
      return 'removed';
    },

    /**
     * `jobId` 의 문구만 바꾸고 나머지 순서와 문구는 그대로 두어 목록 전체를 보낸다.
     *
     * 이미 빠져 있으면 보내지 않고 `'absent'` 를 돌려준다. 다른 곳에서 뺀 공고를 문구 저장이 되살리지
     * 않는다.
     */
    editCopy: async (jobId: number, value: RecommendationValue): Promise<'saved' | 'absent'> => {
      const latest = await fetchLatest();
      if (!latest.some((item) => item.id === jobId)) {
        return 'absent';
      }
      await replace({
        jobs: latest.map((item) =>
          item.id === jobId
            ? {
                jobId,
                recommendationTitle: value.title.trim(),
                recommendationDescription: value.description.trim(),
              }
            : toRequestJob(item),
        ),
      });
      return 'saved';
    },
  };
}
