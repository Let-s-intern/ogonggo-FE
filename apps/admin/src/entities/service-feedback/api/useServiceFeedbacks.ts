import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listServiceFeedbacks } from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

/** 서비스 개선 의견 목록. 웹의 `오공고에 의견 보내기` 로 들어온 것이다. 필터 없이 최신순이다. */
export function useServiceFeedbackList(page: number) {
  return useQuery({
    // 다음 페이지를 받는 동안 지금 페이지를 그대로 둔다. 비우면 표와 페이지 번호가 사라져 1페이지로 돌아간 것처럼 보인다.
    placeholderData: keepPreviousData,
    queryKey: ['admin', 'service-feedbacks', page],
    queryFn: () => unwrapData(listServiceFeedbacks({ page })),
  });
}
