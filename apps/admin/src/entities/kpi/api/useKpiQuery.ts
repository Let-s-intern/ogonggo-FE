import { useQuery } from '@tanstack/react-query';
import { runRedashQuery } from '@/shared/api/redash';
import { type KpiFilters, isDateRangeComplete, toRedashParameters } from '../model/filters';

/**
 * Redash 쿼리 하나의 결과. 쿼리 키에 그 쿼리가 받는 파라미터만 넣어, 상관없는 필터를 바꿔도 다시
 * 부르지 않는다.
 */
export function useKpiQuery(queryId: number, filters: KpiFilters) {
  const parameters = toRedashParameters(queryId, filters);
  return useQuery({
    queryKey: ['admin', 'kpi', queryId, parameters],
    queryFn: () => runRedashQuery(queryId, parameters),
    enabled: isDateRangeComplete(filters),
    // 함수가 Redash 에 30분 캐시를 요청한다(`api/redash-query.ts`). 화면이 그보다 자주 물을 이유가 없다.
    staleTime: 5 * 60_000,
    // 실패는 대개 설정(키·권한) 문제라 다시 시도해도 같다.
    retry: false,
  });
}
