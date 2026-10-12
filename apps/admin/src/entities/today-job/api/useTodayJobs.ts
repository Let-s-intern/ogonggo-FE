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
 * 다시 받아진다. 두 목록은 서로의 캐시를 건드릴 이유가 없다.
 */

/**
 * 고른 순서대로의 오늘의 공고. 페이지 정보가 없는 배열이고 `data` 는 로딩 중에 `undefined` 다.
 * 게시 상태와 무관하게 삭제되지 않은 공고를 주므로 `visibility`·`recruitmentStatus` 로 걸러
 * 보이지 않는다.
 */
export function useTodayJobList() {
  return useQuery({
    queryKey: ['admin', 'today-jobs'],
    queryFn: () => unwrapData(listTodayJobs()),
  });
}

/**
 * 오늘의 공고를 `{ jobs }` 로 통째로 바꾼다. 배열 순서가 노출 순서이고 빈 배열이면 비운다.
 *
 * 성공하면 오늘의 공고 쿼리만 무효화한다. 공고 한 건의 문구를 바꿔도 채용공고 목록 응답에는
 * 반영될 칸이 없다.
 */
export function useReplaceTodayJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReplaceAdminTodayJobsRequest) => unwrapData(replaceTodayJobs(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'today-jobs'] });
    },
  });
}
