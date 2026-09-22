import { KIND_LABELS } from '@/entities/side-study/model/labels';
import { SortToggle } from '@/shared/ui/SortToggle';
import { MyPageFilterDropdown } from '@/widgets/mypage-list';
import {
  APPLICATION_STATUSES,
  buildMyApplicationsHref,
  RECRUITMENT_STATUSES,
  RECRUITMENT_TYPES,
  SORTS,
  type MyApplicationsQuery,
} from '../lib/query';

/** 모집 중인가 마감인가. 목업 필터 줄의 `마감 상태` 다. */
const RECRUITMENT_STATUS_LABELS: Record<(typeof RECRUITMENT_STATUSES)[number], string> = {
  RECRUITING: '모집 중',
  CLOSED: '마감',
};

/** 네 단계. `MyApplications` 의 셀렉트와 같은 문구다(PRD 3 절의 표). */
const APPLICATION_STATUS_LABELS: Record<(typeof APPLICATION_STATUSES)[number], string> = {
  PREPARING: '지원 준비 중',
  COMPLETED: '지원 완료',
  IN_PROGRESS: '활동 중',
  ENDED: '활동 완료',
};

const SORT_LABELS: Record<(typeof SORTS)[number], string> = {
  LATEST: '최근 저장순',
};

const RECRUITMENT_STATUS_OPTIONS = RECRUITMENT_STATUSES.map(
  (value) => [value, RECRUITMENT_STATUS_LABELS[value]] as const,
);
const RECRUITMENT_TYPE_OPTIONS = RECRUITMENT_TYPES.map(
  (value) => [value, KIND_LABELS[value]] as const,
);
const APPLICATION_STATUS_OPTIONS = APPLICATION_STATUSES.map(
  (value) => [value, APPLICATION_STATUS_LABELS[value]] as const,
);
const SORT_OPTIONS = SORTS.map((value) => ({ value, label: SORT_LABELS[value] }));

export interface MyApplicationsFiltersProps {
  query: MyApplicationsQuery;
}

/**
 * 사이드·스터디 탭의 필터 드롭다운들(PRD 3 절). 하드코딩한 두 탭에는 거를 데이터가 없어 필터
 * 줄 자체를 그리지 않는다.
 *
 * 목업 필터 줄에는 `마감 상태` 와 `지원 상태` 둘뿐인데 `모집 구분` 을 하나 더 뒀다.
 * `listMyRecruitmentApplications` 가 `recruitmentType` 을 받고, 이 탭이 사이드 프로젝트와
 * 스터디를 함께 담고 있어 가르는 수단이 필요하다.
 */
export function MyApplicationsFilters({ query }: MyApplicationsFiltersProps) {
  return (
    <>
      <MyPageFilterDropdown
        label="마감 상태"
        selected={query.recruitmentStatus}
        options={RECRUITMENT_STATUS_OPTIONS}
        buildHref={(recruitmentStatus) => buildMyApplicationsHref(query, { recruitmentStatus })}
      />
      <MyPageFilterDropdown
        label="모집 구분"
        selected={query.recruitmentType}
        options={RECRUITMENT_TYPE_OPTIONS}
        buildHref={(recruitmentType) => buildMyApplicationsHref(query, { recruitmentType })}
      />
      <MyPageFilterDropdown
        label="지원 상태"
        selected={query.applicationStatus}
        options={APPLICATION_STATUS_OPTIONS}
        buildHref={(applicationStatus) => buildMyApplicationsHref(query, { applicationStatus })}
      />
    </>
  );
}

/**
 * 필터 줄 오른쪽 끝 정렬 드롭다운. 생성 타입에 값이 `LATEST` 하나뿐이라 지금은 고를 것이
 * 하나다 — 목업의 `최근 저장순 ▾` 자리이고, 백엔드가 정렬을 더하면 목록만 늘어난다.
 */
export function MyApplicationsSort({ query }: MyApplicationsFiltersProps) {
  return (
    <SortToggle
      options={SORT_OPTIONS}
      current={query.sort ?? 'LATEST'}
      buildHref={(sort) => buildMyApplicationsHref(query, { sort })}
    />
  );
}
