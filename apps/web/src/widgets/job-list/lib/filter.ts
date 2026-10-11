import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '@/entities/job/model/labels';
import { track } from '@/shared/analytics/dataLayer';
import type { JobListQuery } from './query';

/**
 * 채용 형태·요구 경력으로 고른 값. PC 사이드바(`JobFilterSidebar`)와 모바일 필터 시트가 같은 모양의
 * 상태를 들고, 같은 규칙으로 바꾸고, 같은 주소(`buildJobListHref`)로 옮긴다. 다른 것은 적용 시점
 * 뿐이다 — 사이드바는 누르는 즉시, 시트는 `공고보기` 를 눌러야 한다.
 */
export type FilterSelection = Required<Pick<JobListQuery, 'employmentTypes' | 'experienceTypes'>>;

export type FilterKey = keyof FilterSelection;

export interface FilterGroup {
  label: string;
  /** GTM `filter_apply` 의 `filter_type`. 달력과 같은 이름이다. */
  filterType: string;
  /** `[값, 이름]`. 보이는 순서이자 주소에 적히는 순서다. */
  options: readonly (readonly [value: string, label: string])[];
}

/**
 * 채용 형태는 `EMPLOYMENT_TYPE_LABELS` 의 일곱 개 전부다. 시안에는 `기타` 가 없지만 빼면 기타 공고는
 * 전체에서만 보인다.
 */
export const FILTER_GROUPS: Record<FilterKey, FilterGroup> = {
  employmentTypes: {
    label: '채용 형태',
    filterType: 'employment',
    options: Object.entries(EMPLOYMENT_TYPE_LABELS),
  },
  experienceTypes: {
    label: '요구 경력',
    filterType: 'experience',
    options: Object.entries(EXPERIENCE_TYPE_LABELS),
  },
};

export function selectionOf(query: JobListQuery): FilterSelection {
  return {
    employmentTypes: query.employmentTypes ?? [],
    experienceTypes: query.experienceTypes ?? [],
  };
}

/**
 * 값 하나를 켜거나 끈 결과. 순서는 옵션 순서로 맞춘다 — 누른 순서대로 두면 같은 필터가 주소
 * 두 개로 갈린다. 전부 고르면 비운다(`parseEnumList` 와 같은 규칙, 전부와 전체는 같은 필터다).
 */
export function toggleSelection<TSelection extends FilterSelection>(
  selection: TSelection,
  key: FilterKey,
  value: string,
): TSelection {
  const options = FILTER_GROUPS[key].options.map(([option]) => option);
  const current: readonly string[] = selection[key];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  const ordered = options.filter((option) => next.includes(option));
  // 값은 같은 키의 옵션에서만 오므로 `key` 의 배열 타입과 맞는다.
  return {
    ...selection,
    [key]: ordered.length === options.length ? [] : ordered,
  };
}

/** `전체`. 그 묶음의 선택을 비운다. */
export function clearSelection<TSelection extends FilterSelection>(
  selection: TSelection,
  key: FilterKey,
): TSelection {
  return { ...selection, [key]: [] };
}

export function isSelectionEmpty(selection: FilterSelection): boolean {
  return selection.employmentTypes.length === 0 && selection.experienceTypes.length === 0;
}

/** 두 선택이 같은지. 값은 옵션 순서로 정렬돼 있어 자리별로 비교하면 된다. */
export function isSameSelection(a: FilterSelection, b: FilterSelection): boolean {
  return (Object.keys(FILTER_GROUPS) as FilterKey[]).every((key) => {
    const left: readonly string[] = a[key];
    const right: readonly string[] = b[key];
    return left.length === right.length && left.every((value, index) => value === right[index]);
  });
}

/**
 * 고른 값 하나를 GTM 으로 보낸다. `filter_type` 은 기존 이름(`employment`, `experience`)을 그대로
 * 쓴다. 복수 선택에서는 추가된 값마다 한 건이고, 해제와 초기화는 보내지 않는다.
 */
export function trackFilterSelected(filterType: string, value: string): void {
  track('filter_apply', {
    filter_type: filterType,
    filter_value: value,
    filter_action: 'select',
  });
}

/** `before` 에 없던 값마다 `trackFilterSelected` 를 보낸다. 시트의 `공고보기` 가 쓴다. */
export function trackAddedSelections(before: FilterSelection, after: FilterSelection): void {
  for (const key of Object.keys(FILTER_GROUPS) as FilterKey[]) {
    const previous: readonly string[] = before[key];
    for (const value of after[key]) {
      if (!previous.includes(value)) {
        trackFilterSelected(FILTER_GROUPS[key].filterType, value);
      }
    }
  }
}
