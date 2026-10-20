import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  CHANNEL_OPTIONS,
  DEFAULT_KPI_FILTERS,
  EXPERIENCE_OPTIONS,
  JOB_CATEGORY_OPTIONS,
  type KpiFilters,
  PERIOD_OPTIONS,
  RANGE_OPTIONS,
  type RangePreset,
  WINDOW_OPTIONS,
} from '@/entities/kpi';

/**
 * 통계 필터를 URL 쿼리스트링에서 읽고 쓴다. 목록 화면(`@/shared/lib/useListQuery`)과 같은 이유로 —
 * 걸러 본 화면을 그대로 북마크하고 공유할 수 있어야 한다. 기본값과 같은 값은 URL 에 남기지 않는다.
 *
 * 목록에 없는 값은 기본값으로 읽는다. Redash 가 enum 밖의 값을 거절하므로, 손으로 고친 URL 이
 * 화면 전체를 오류로 만들지 않게 여기서 거른다.
 */
const PARAM_KEYS: Record<keyof KpiFilters, string> = {
  range: 'range',
  start: 'start',
  end: 'end',
  period: 'period',
  channel: 'channel',
  jobCategory: 'job',
  experience: 'experience',
  window: 'window',
};

function pick(value: string | null, options: readonly string[], fallback: string): string {
  return value !== null && options.includes(value) ? value : fallback;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function useKpiFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<KpiFilters>(() => {
    const read = (key: keyof KpiFilters) => searchParams.get(PARAM_KEYS[key]);
    const start = read('start') ?? '';
    const end = read('end') ?? '';
    return {
      range: pick(
        read('range'),
        RANGE_OPTIONS.map((option) => option.value),
        DEFAULT_KPI_FILTERS.range,
      ) as RangePreset,
      start: ISO_DATE.test(start) ? start : '',
      end: ISO_DATE.test(end) ? end : '',
      period: pick(read('period'), PERIOD_OPTIONS, DEFAULT_KPI_FILTERS.period),
      channel: pick(read('channel'), CHANNEL_OPTIONS, DEFAULT_KPI_FILTERS.channel),
      jobCategory: pick(read('jobCategory'), JOB_CATEGORY_OPTIONS, DEFAULT_KPI_FILTERS.jobCategory),
      experience: pick(read('experience'), EXPERIENCE_OPTIONS, DEFAULT_KPI_FILTERS.experience),
      window: pick(read('window'), WINDOW_OPTIONS, DEFAULT_KPI_FILTERS.window),
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<KpiFilters>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(patch) as [keyof KpiFilters, string][]) {
        if (value === DEFAULT_KPI_FILTERS[key]) {
          next.delete(PARAM_KEYS[key]);
        } else {
          next.set(PARAM_KEYS[key], value);
        }
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return { filters, setFilters };
}
