import { SortToggle } from '@/shared/ui/SortToggle';
import { MyPageFilterDropdown } from '@/widgets/mypage-list';
import {
  APPLICATION_STATUSES,
  buildMyPostsHref,
  RECRUITMENT_STATUSES,
  SORTS,
  type MyPostsQuery,
} from '../lib/query';

const RECRUITMENT_STATUS_LABELS: Record<(typeof RECRUITMENT_STATUSES)[number], string> = {
  RECRUITING: '모집 중',
  CLOSED: '마감',
};

/**
 * 목업의 필터 이름은 `지원 상태` 인데 문구를 백엔드 값에 맞춘다(PRD 4 절 결정). 내가 쓴 글
 * 목록에서 거르는 것은 남의 지원 진행 단계가 아니라 "지원자가 붙었는가" 다.
 */
const APPLICATION_STATUS_LABELS: Record<(typeof APPLICATION_STATUSES)[number], string> = {
  HAS_APPLICATIONS: '지원자 있음',
  NO_APPLICATIONS: '지원자 없음',
};

const SORT_LABELS: Record<(typeof SORTS)[number], string> = {
  LATEST_SAVED: '최근 저장순',
};

const RECRUITMENT_STATUS_OPTIONS = RECRUITMENT_STATUSES.map(
  (value) => [value, RECRUITMENT_STATUS_LABELS[value]] as const,
);
const APPLICATION_STATUS_OPTIONS = APPLICATION_STATUSES.map(
  (value) => [value, APPLICATION_STATUS_LABELS[value]] as const,
);
const SORT_OPTIONS = SORTS.map((value) => ({ value, label: SORT_LABELS[value] }));

export interface MyPostsFiltersProps {
  query: MyPostsQuery;
}

/**
 * 필터 줄의 드롭다운 둘(PRD 4 절). 목업 필터 줄에 있는 것도 이 둘이다.
 *
 * `listMyRecruitmentPosts` 는 `status`(임시저장·공개·비공개) 와 `recruitmentType`(사이드·
 * 스터디) 도 받지만 그리지 않았다. 목업에 없고 task 도 둘을 말하지 않는다 — 어느 쪽도
 * 걸러 본 적 없는 필터를 화면에 늘리는 것은 이 Push 의 범위가 아니다. 근거는
 * `.claude/tasks/memos/결정-마이페이지-push3-2026-09-21.md` 에 있다.
 */
export function MyPostsFilters({ query }: MyPostsFiltersProps) {
  return (
    <>
      <MyPageFilterDropdown
        label="마감 상태"
        selected={query.recruitmentStatus}
        options={RECRUITMENT_STATUS_OPTIONS}
        buildHref={(recruitmentStatus) => buildMyPostsHref(query, { recruitmentStatus })}
      />
      <MyPageFilterDropdown
        label="지원자 상태"
        selected={query.applicationStatus}
        options={APPLICATION_STATUS_OPTIONS}
        buildHref={(applicationStatus) => buildMyPostsHref(query, { applicationStatus })}
      />
    </>
  );
}

/**
 * 필터 줄 오른쪽 끝 정렬 드롭다운. 생성 타입에 값이 `LATEST_SAVED` 하나뿐이라 지금은 고를
 * 것이 하나다 — 목업의 `최근 저장순 ▾` 자리이고, 백엔드가 정렬을 더하면 목록만 늘어난다.
 */
export function MyPostsSort({ query }: MyPostsFiltersProps) {
  return (
    <SortToggle
      options={SORT_OPTIONS}
      current={query.sort ?? 'LATEST_SAVED'}
      buildHref={(sort) => buildMyPostsHref(query, { sort })}
    />
  );
}
