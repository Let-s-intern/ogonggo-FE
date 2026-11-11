import { SearchCommand } from '@/features/search-command';
import { buildJobListHref, type JobListQuery } from '../lib/query';
import { JobFilterButton } from './JobFilterSheet';

export interface SearchFilterBarProps {
  query: JobListQuery;
  /** 지금 목록의 전체 건수. 필터 시트의 `N개 공고보기` 첫 값이다. */
  totalCount: number;
}

/**
 * lg 미만의 검색·필터 줄. 검색칸(`SearchCommand`)과 `필터` 버튼(`JobFilterButton`)이다. 채용 형태·요구 경력은
 * `필터` 시트 안에 있다. lg 이상은 왼쪽 열의 `JobFilterSidebar` 가 검색과 필터를 맡아 이 줄은 비어
 * 있다. 직무는 이 줄이 아니라 위의 직무 칩(`JobRoleChips`)이 맡는다.
 *
 * 검색칸을 누르면 검색 모달이 뜬다(`features/search-command`). 검색하면 걸어 둔 필터·정렬을 들고 1쪽으로 간다.
 */
export function SearchFilterBar({ query, totalCount }: SearchFilterBarProps) {
  // 검색이 들고 갈 나머지 상태. 손으로 나열하면 필터가 늘 때마다 빠진다 — 검색어만 뺀 주소를
  // 되읽어 만든다(공고 달력의 `KeywordFilter` 와 같은 방법).
  const carried = new URLSearchParams(
    buildJobListHref(query, { q: undefined }).split('?')[1] ?? '',
  );

  return (
    // 모바일에서는 `contents` 로 풀려 검색칸이 한 줄을 다 쓰고 버튼과 정렬이 그 아래 한 줄에 선다.
    <div className="contents md:flex md:flex-wrap md:items-center md:gap-2">
      {/* lg 이상은 왼쪽 필터 열(`JobFilterSidebar`)의 검색창을 쓴다. */}
      <div className="w-full md:w-auto md:min-w-[220px] md:flex-1 lg:hidden">
        <SearchCommand scope="jobs" value={query.q} action="/" params={[...carried]} />
      </div>
      <JobFilterButton query={query} totalCount={totalCount} />
    </div>
  );
}
