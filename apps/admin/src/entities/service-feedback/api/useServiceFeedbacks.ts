import { useQuery } from '@tanstack/react-query';
import { listServiceFeedbacks } from '@ogonggo/api/src/admin';
import { unwrapData } from '@/shared/api/unwrapData';

/** 서비스 개선 의견 목록. 웹의 `오공고에 의견 보내기` 로 들어온 것이다. 필터 없이 최신순이다. */
export function useServiceFeedbackList(page: number) {
  return useQuery({
    queryKey: ['admin', 'service-feedbacks', page],
    queryFn: () => unwrapData(listServiceFeedbacks({ page })),
  });
}
