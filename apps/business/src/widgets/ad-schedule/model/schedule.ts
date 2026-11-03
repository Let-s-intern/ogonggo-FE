import type {
  AdJobField,
  AdPlacementAvailabilityResponse,
  AdPlacementPeriodAvailability,
} from '@/entities/advertisement';

/** 달력의 열 하나. 주 단위 구좌의 한 주(월~일)다. */
export interface ScheduleWeek {
  startDate: string;
  endDate: string;
}

/** 칸 하나. 공고 기간 단위 구좌는 그 달의 주 여럿을 한 칸으로 덮는다(`span`). */
export interface ScheduleCell {
  period: AdPlacementPeriodAvailability;
  span: number;
}

export type CellState = 'OPEN' | 'PARTIAL' | 'CLOSED';

export function cellState(
  period: Pick<AdPlacementPeriodAvailability, 'remaining' | 'capacity'>,
): CellState {
  if (period.remaining <= 0) return 'CLOSED';
  return period.remaining < period.capacity ? 'PARTIAL' : 'OPEN';
}

/** 주 단위 구좌들의 주 목록. 열 머리가 된다. */
export function weeksOf(items: AdPlacementAvailabilityResponse[]): ScheduleWeek[] {
  const weekly = items.find((item) => item.placement.unit === 'WEEK');
  if (!weekly) return [];
  const seen = new Map<string, ScheduleWeek>();
  for (const period of weekly.periods) {
    seen.set(period.startDate, { startDate: period.startDate, endDate: period.endDate });
  }
  return [...seen.values()];
}

/**
 * 한 줄의 칸. 주 단위면 주마다 한 칸, 공고 기간 단위면 그 달에 시작하는 주들을 한 칸으로 묶는다. 직무별 구좌는
 * `jobField` 의 칸만 고른다.
 */
export function cellsOf(
  item: AdPlacementAvailabilityResponse,
  weeks: ScheduleWeek[],
  jobField?: AdJobField,
): ScheduleCell[] {
  const periods = item.periods.filter((period) => period.jobField === jobField);
  if (item.placement.unit === 'WEEK') {
    return weeks.flatMap((week) => {
      const period = periods.find((each) => each.startDate === week.startDate);
      return period ? [{ period, span: 1 }] : [];
    });
  }
  return periods
    .map((period) => ({
      period,
      span: weeks.filter(
        (week) => week.startDate >= period.startDate && week.startDate <= period.endDate,
      ).length,
    }))
    .filter((cell) => cell.span > 0);
}

/** 직무별 구좌의 접힌 줄. 주마다 모든 직무의 잔여·슬롯을 더한다. */
export function summedCells(
  item: AdPlacementAvailabilityResponse,
  weeks: ScheduleWeek[],
): ScheduleCell[] {
  return weeks.map((week) => {
    const periods = item.periods.filter((period) => period.startDate === week.startDate);
    return {
      period: {
        startDate: week.startDate,
        endDate: week.endDate,
        capacity: periods.reduce((sum, each) => sum + each.capacity, 0),
        remaining: periods.reduce((sum, each) => sum + each.remaining, 0),
      },
      span: 1,
    };
  });
}

/** 직무별 구좌의 직무 목록. 데이터에 나온 순서다. */
export function jobFieldsOf(item: AdPlacementAvailabilityResponse): AdJobField[] {
  return [...new Set(item.periods.flatMap((period) => (period.jobField ? [period.jobField] : [])))];
}
