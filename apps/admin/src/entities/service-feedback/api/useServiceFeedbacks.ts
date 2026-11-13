import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listServiceFeedbacks, type AdminServiceFeedbackResponse } from '@ogonggo/api/src/admin';
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

/** CSV 로 받을 때 한 번에 읽는 개수. API 최대값이다. */
const EXPORT_PAGE_SIZE = 100;

/**
 * CSV 내보내기용 전체 목록. 페이지를 끝까지 읽는다. 읽는 사이 새 의견이 들어와 한 칸씩 밀리면 같은 건이 두 번
 * 오므로 ID 로 한 번만 남긴다(`fetchAllAdInquiries` 와 같은 방식).
 */
export async function fetchAllServiceFeedbacks(): Promise<AdminServiceFeedbackResponse[]> {
  const rows = new Map<number, AdminServiceFeedbackResponse>();
  for (let page = 1; ; page += 1) {
    const data = await unwrapData(listServiceFeedbacks({ page, size: EXPORT_PAGE_SIZE }));
    for (const item of data?.items ?? []) rows.set(item.id, item);
    if (!data || page >= data.pageInfo.totalPages) break;
  }
  return [...rows.values()];
}
