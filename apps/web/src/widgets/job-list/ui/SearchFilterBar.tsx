import { type JobListQuery } from '../lib/query';
import { JobFilterButton } from './JobFilterSheet';
import { JobSearchCommand } from './JobSearchCommand';

export interface SearchFilterBarProps {
  query: JobListQuery;
  /** 지금 목록의 전체 건수. 필터 시트의 `N개 공고보기` 첫 값이다. */
  totalCount: number;
}

/**
 * lg 미만의 검색·필터 줄. 검색칸(`JobSearchCommand`)과 `필터` 버튼(`JobFilterButton`)이다. 채용 형태·요구 경력은
 * `필터` 시트 안에 있다. lg 이상은 왼쪽 열의 `JobFilterSidebar` 가 검색과 필터를 맡아 이 줄은 비어
 * 있다. 직무는 이 줄이 아니라 위의 직무 칩(`JobRoleChips`)이 맡는다.
 *
 * 검색칸을 누르면 검색 모달이 뜬다(`JobSearchCommand`). 검색하면 모달에서 고른 필터와 지금 정렬로 1쪽에 간다.
 */
export function SearchFilterBar({ query, totalCount }: SearchFilterBarProps) {
  return (
    // 모바일에서는 `contents` 로 풀려 검색칸이 한 줄을 다 쓰고 버튼과 정렬이 그 아래 한 줄에 선다.
    <div className="contents md:flex md:flex-wrap md:items-center md:gap-2">
      {/* lg 이상은 왼쪽 필터 열(`JobFilterSidebar`)의 검색창을 쓴다. */}
      <div className="w-full md:w-auto md:min-w-[220px] md:flex-1 lg:hidden">
        <JobSearchCommand query={query} />
      </div>
      <JobFilterButton query={query} totalCount={totalCount} />
    </div>
  );
}
