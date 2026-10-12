import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTodayJobs,
  replaceTodayJobs,
  type ReplaceAdminTodayJobsRequest,
} from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

/**
 * 오늘의 공고(오공고 PICK) 조회·설정.
 *
 * 쿼리 키는 `['admin', 'today-jobs']` 다. `['admin', 'jobs', …]` 밑에 두지 않는다 — 채용공고
 * 목록·상세를 무효화할 때 휘말려 오늘의 공고가 다시 받아지고, 반대로 여기를 무효화하면 공고 목록이
 * 다시 받아진다.
 *
 * 그렇다고 두 캐시가 무관한 것은 아니다. 공고의 노출을 바꾸거나 공고를 지우면 이 목록의
 * `visibility` 와 항목 존재 여부가 바뀌는데, 그 변경은 `['admin', 'jobs']` 만 무효화한다. 낡은 값이
 * 보이지 않는 것은 기본 `staleTime` 이 0 이라 이 화면에 들어올 때 다시 받기 때문이다. 이 훅에
 * `staleTime` 을 주거나 다른 화면이 캐시를 그대로 읽게 하면 공고 쪽 변경에서 이 키도 무효화해야 한다.
 */

/** 오늘의 공고 쿼리 키. 목록을 직접 다시 받는 쪽(`features/today-job`)이 같은 키를 쓰도록 내보낸다. */
export const TODAY_JOBS_QUERY_KEY = ['admin', 'today-jobs'] as const;

/**
 * 고른 순서대로의 오늘의 공고. 페이지 정보가 없는 배열이고 `data` 는 로딩 중에 `undefined` 다.
 * 게시 상태와 무관하게 삭제되지 않은 공고를 주므로 `visibility`·`recruitmentStatus` 로 걸러
 * 보이지 않는다.
 */
export function useTodayJobList() {
  return useQuery({
    queryKey: TODAY_JOBS_QUERY_KEY,
    queryFn: () => unwrapData(listTodayJobs()),
  });
}

/**
 * 오늘의 공고를 `{ jobs }` 로 통째로 바꾼다. 배열 순서가 노출 순서이고 빈 배열이면 비운다.
 *
 * 성공하면 응답이 돌려준 바뀐 목록으로 오늘의 공고 캐시를 맞추고, 그 쿼리만 무효화한다. 응답을
 * 캐시에 두지 않으면 다시 받는 동안(또는 다시 받기에 실패하면) 화면이 저장 전 목록을 본다. 공고
 * 한 건의 문구를 바꿔도 채용공고 목록 응답에는 반영될 칸이 없다.
 */
export function useReplaceTodayJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReplaceAdminTodayJobsRequest) => unwrapData(replaceTodayJobs(input)),
    onSuccess: (changed) => {
      if (changed) {
        queryClient.setQueryData(TODAY_JOBS_QUERY_KEY, changed);
      }
      void queryClient.invalidateQueries({ queryKey: TODAY_JOBS_QUERY_KEY });
    },
  });
}
