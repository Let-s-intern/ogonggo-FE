import { cn, FilterButton, SearchInput } from '@ogonggo/ui';
import { filterApplyEvents } from '@/shared/analytics/dataLayer';
import { TrackedLink } from '@/shared/analytics/TrackedLink';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '@/entities/job/model/labels';
import type { JobEmploymentType, JobExperienceType } from '@/entities/job/model/types';
import { buildJobListHref, type JobListQuery } from '../lib/query';
import { JobRoleFilter } from './JobRoleFilter';

export interface SearchFilterBarProps {
  query: JobListQuery;
}

const EMPLOYMENT_TYPE_OPTIONS = Object.entries(EMPLOYMENT_TYPE_LABELS) as [
  JobEmploymentType,
  string,
][];
const EXPERIENCE_TYPE_OPTIONS = Object.entries(EXPERIENCE_TYPE_LABELS) as [
  JobExperienceType,
  string,
][];

/**
 * `home.png`의 "채용 형태 ▾"/"경력 ▾" 드롭다운 — `SortToggle`과 같은 `<details>`/`<summary>`
 * 패턴(자바스크립트 없이 여닫힘)으로 통일해, 네이티브 `<select>`가 열 때 OS 기본 팝업으로
 * 렌더되던 것과 달리 항상 같은 커스텀 스타일로 보이게 한다. 옵션을 고르면 그 자리에서 바로
 * 적용되는 `<Link>` 이동이다(제출 버튼 필요 없음).
 *
 * 트리거는 `FilterButton`이 그린다(`docs/asset/v3-1/filter/`). 여닫는 `<details>` 껍데기와
 * 목록은 여기 남는다 — 그것이 그 컴포넌트가 트리거만 맡는 이유다(PRD 5절).
 *
 * `state`는 `default`와 `selected` 둘만 쓴다. 에셋의 `open`(파란 테두리)은 `<details>`가 열린
 * 상태인데, 이 줄은 서버에서 그려져 리액트가 열림을 모른다. 대신 꺾쇠 뒤집기만 CSS로 남긴다 —
 * `group-open:[&>span]:rotate-180`은 부모 `<details open>` 아래에서 트리거의 유일한 `<span>`
 * 자식(꺾쇠)을 돌린다. 색은 `state`가, 회전은 CSS가 정해서 둘이 겹치지 않는다.
 */
function FilterDropdown<TValue extends string>({
  label,
  filterType,
  selected,
  options,
  buildHref,
}: {
  label: string;
  /** GTM `filter_apply` 의 `filter_type`. `employment` | `experience` */
  filterType: string;
  selected?: TValue;
  options: [TValue, string][];
  buildHref: (value: TValue | undefined) => string;
}) {
  const currentLabel = options.find(([value]) => value === selected)?.[1] ?? label;

  return (
    // lg 이상은 왼쪽 필터 열이 같은 필터를 체크박스로 보인다.
    <details data-dropdown className="group relative lg:hidden">
      <FilterButton
        state={selected ? 'selected' : 'default'}
        className="group-open:[&>span]:rotate-180"
      >
        {currentLabel}
      </FilterButton>
      <ul className="absolute right-0 z-10 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-md">
        <li>
          <TrackedLink
            href={buildHref(undefined)}
            events={filterApplyEvents(filterType, selected, undefined)}
            className={cn(
              'block px-3 py-1.5 text-sm',
              !selected ? 'font-semibold text-blue-600' : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            {/* 라벨(`경력`)을 그대로 쓰면 선택지 `경력`과 같은 이름이 두 줄이 되어 걸렸는지 알 수 없다. */}
            전체
          </TrackedLink>
        </li>
        {options.map(([value, optionLabel]) => (
          <li key={value}>
            <TrackedLink
              href={buildHref(value)}
              events={filterApplyEvents(filterType, selected, value)}
              className={cn(
                'block px-3 py-1.5 text-sm',
                value === selected
                  ? 'font-semibold text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {optionLabel}
            </TrackedLink>
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * 검색어는 자유 텍스트라 `<Link>` 이동으로는 못 만든다 — `<form method="GET">`은 유지한다.
 * 채용형태·경력 드롭다운은 `FilterDropdown`으로 클릭 즉시 적용된다.
 *
 * 입력은 `SearchInput`이 그린다(`docs/asset/v3-1/search/`). 그 컴포넌트의 돋보기는 장식이라
 * (에셋에도 누를 것이 없다) 제출 버튼이 따로 필요하다. 글자 하나 없는 자리를 만들지 않으려고
 * `sr-only` 버튼으로 뒀다 — 필드가 하나뿐이라 엔터로도 제출되지만, 그 암묵 제출에만 기대면
 * 보조기술에서 "검색" 이라는 조작이 사라진다.
 */
export function SearchFilterBar({ query }: SearchFilterBarProps) {
  // 검색 form 이 실어 보낼 나머지 상태. 손으로 나열하면 필터가 늘 때마다 빠진다 — 검색어만 뺀 주소를
  // 되읽어 만든다(공고 달력의 `KeywordFilter` 와 같은 방법).
  const carried = new URLSearchParams(
    buildJobListHref(query, { q: undefined }).split('?')[1] ?? '',
  );

  return (
    // 모바일에서는 `contents` 로 풀려 검색칸이 한 줄을 다 쓰고 필터와 정렬이 그 아래 한 줄에
    // 선다. 시안(`docs/asset/v9 mobile/채용공고 목록.png`)은 한 줄 가로 스크롤인데, 필터 목록이
    // 버튼 아래로 떨어지는 드롭다운이라 스크롤 상자 안에 두면 잘린다.
    <div className="contents md:flex md:flex-wrap md:items-center md:gap-2">
      {/* lg 이상은 왼쪽 필터 열(`JobFilterSidebar`)의 검색창을 쓴다. */}
      <form
        action="/"
        method="GET"
        className="w-full md:w-auto md:min-w-[220px] md:flex-1 lg:hidden"
      >
        {[...carried].map(([name, value]) => (
          <input key={`${name}=${value}`} type="hidden" name={name} value={value} />
        ))}
        <SearchInput name="q" defaultValue={query.q} placeholder="공고 검색" />
        <button type="submit" className="sr-only">
          검색
        </button>
      </form>
      <JobRoleFilter query={query} />
      <FilterDropdown
        label="채용 형태"
        filterType="employment"
        selected={query.employmentTypes?.length === 1 ? query.employmentTypes[0] : undefined}
        options={EMPLOYMENT_TYPE_OPTIONS}
        buildHref={(value) =>
          buildJobListHref(query, { employmentTypes: value ? [value] : undefined })
        }
      />
      <FilterDropdown
        label="요구 경력"
        filterType="experience"
        selected={query.experienceTypes?.length === 1 ? query.experienceTypes[0] : undefined}
        options={EXPERIENCE_TYPE_OPTIONS}
        buildHref={(value) =>
          buildJobListHref(query, { experienceTypes: value ? [value] : undefined })
        }
      />
    </div>
  );
}
