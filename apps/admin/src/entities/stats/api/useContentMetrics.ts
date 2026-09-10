import { useQuery } from '@tanstack/react-query';
import type { ContentMetricRow } from '@ogonggo/api/src/mocks/admin/stats';
import { adminGet, type PageResponse } from '@/shared/api/adminClient';

export type { ContentMetricRow };

export interface ContentMetricFilters {
  page: number;
  contentType: string;
  registeredWithinDays: string;
  sort: string;
}

export function useContentMetrics(filters: ContentMetricFilters) {
  return useQuery({
    queryKey: ['admin', 'stats', 'content', filters],
    queryFn: () =>
      adminGet<PageResponse<ContentMetricRow>>('/api/v1/admin/stats/content', { ...filters }),
  });
}
