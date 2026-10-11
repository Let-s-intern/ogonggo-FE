import { SearchInput } from '@ogonggo/ui';
import { buildJobListHref, type JobListQuery } from '../lib/query';
import { JobFilterButton } from './JobFilterSheet';
import { JobRoleFilter } from './JobRoleFilter';

export interface SearchFilterBarProps {
  query: JobListQuery;
  /** 지금 목록의 전체 건수. 필터 시트의 `N개 공고보기` 첫 값이다. */
  totalCount: number;
}

/**
 * lg 미만의 검색·필터 줄. 검색어 form, `직무` 버튼(`JobRoleFilter`), `필터` 버튼(`JobFilterButton`)이다.
 * 채용 형태·요구 경력은 `필터` 시트 안에 있다. lg 이상은 왼쪽 열의 `JobFilterSidebar` 가 검색과 필터를
 * 맡고, 이 줄에는 `직무` 버튼만 남는다.
 *
 * 검색어는 자유 텍스트라 `<Link>` 이동으로는 못 만든다 — `<form method="GET">`은 유지한다.
 *
 * 입력은 `SearchInput`이 그린다(`docs/asset/v3-1/search/`). 그 컴포넌트의 돋보기는 장식이라
 * (에셋에도 누를 것이 없다) 제출 버튼이 따로 필요하다. 글자 하나 없는 자리를 만들지 않으려고
 * `sr-only` 버튼으로 뒀다 — 필드가 하나뿐이라 엔터로도 제출되지만, 그 암묵 제출에만 기대면
 * 보조기술에서 "검색" 이라는 조작이 사라진다.
 */
export function SearchFilterBar({ query, totalCount }: SearchFilterBarProps) {
  // 검색 form 이 실어 보낼 나머지 상태. 손으로 나열하면 필터가 늘 때마다 빠진다 — 검색어만 뺀 주소를
  // 되읽어 만든다(공고 달력의 `KeywordFilter` 와 같은 방법).
  const carried = new URLSearchParams(
    buildJobListHref(query, { q: undefined }).split('?')[1] ?? '',
  );

  return (
    // 모바일에서는 `contents` 로 풀려 검색칸이 한 줄을 다 쓰고 버튼과 정렬이 그 아래 한 줄에 선다.
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
      <JobFilterButton query={query} totalCount={totalCount} />
    </div>
  );
}
