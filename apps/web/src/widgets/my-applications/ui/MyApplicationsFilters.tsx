import type { ApplicationStageId } from '@/features/application-board';
import { KIND_LABELS } from '@/entities/side-study/model/labels';
import { SortToggle } from '@/shared/ui/SortToggle';
import { MyPageFilterDropdown } from '@/widgets/mypage-list';
import {
  applicationStagesOf,
  buildMyApplicationsHref,
  RECRUITMENT_STATUSES,
  RECRUITMENT_TYPES,
  SORTS,
  stageOf,
  type MyApplicationsQuery,
} from '../lib/query';

/** 모집 중인가 마감인가. 목업 필터 줄의 `마감 상태` 다. */
const RECRUITMENT_STATUS_LABELS: Record<(typeof RECRUITMENT_STATUSES)[number], string> = {
  RECRUITING: '모집 중',
  CLOSED: '마감',
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
const SORT_OPTIONS = SORTS.map((value) => ({ value, label: SORT_LABELS[value] }));

export interface MyApplicationsFiltersProps {
  query: MyApplicationsQuery;
}

/**
 * 필터 줄의 드롭다운들. **세 탭이 모두 쓴다** — v4 때는 실연동인 사이드·스터디 탭에만 있었다.
 *
 * `지원 상태` 의 선택지는 그 탭의 단계다(`applicationStagesOf`). 채용공고·부트캠프 탭에서는
 * 이 드롭다운이 거르는 값이 아니라 **어느 단계를 그릴지**이고, 아무것도 고르지 않아도 늘 한
 * 단계가 골라져 있다 — 이유는 `lib/query.ts` 의 `DEFAULT_STAGE` 에 적었다.
 *
 * `모집 구분` 은 사이드·스터디 탭에만 둔다. 목업 필터 줄에는 없지만
 * `listMyRecruitmentApplications` 가 `recruitmentType` 을 받고, 이 탭이 사이드 프로젝트와
 * 스터디를 함께 담고 있어 가르는 수단이 필요하다.
 */
export function MyApplicationsFilters({ query }: MyApplicationsFiltersProps) {
  const stageOptions = applicationStagesOf(query.tab).map(
    (stage) => [stage.id, stage.label] as const,
  );

  return (
    <>
      <MyPageFilterDropdown
        label="마감 상태"
        selected={query.recruitmentStatus}
        options={RECRUITMENT_STATUS_OPTIONS}
        buildHref={(recruitmentStatus) => buildMyApplicationsHref(query, { recruitmentStatus })}
      />
      {query.tab === 'side-studies' ? (
        <MyPageFilterDropdown
          label="모집 구분"
          selected={query.recruitmentType}
          options={RECRUITMENT_TYPE_OPTIONS}
          buildHref={(recruitmentType) => buildMyApplicationsHref(query, { recruitmentType })}
        />
      ) : null}
      <MyPageFilterDropdown<ApplicationStageId>
        label="지원 상태"
        selected={stageOf(query)}
        options={stageOptions}
        buildHref={(applicationStatus) => buildMyApplicationsHref(query, { applicationStatus })}
      />
    </>
  );
}

/**
 * 필터 줄 오른쪽 끝 정렬 드롭다운. 생성 타입에 값이 `LATEST` 하나뿐이라 지금은 고를 것이
 * 하나다 — 목업의 `최근 저장순 ▾` 자리이고, 백엔드가 정렬을 더하면 목록만 늘어난다.
 *
 * 사이드·스터디 탭에만 그린다. 북마크 목록의 정렬은 `RECENTLY_SAVED` 하나로 고정이라
 * (`applicationBoardApi.ts`) 그 탭에서는 주소에 적을 값이 없다.
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
