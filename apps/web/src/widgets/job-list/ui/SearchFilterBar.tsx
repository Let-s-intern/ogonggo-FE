import Link from 'next/link';
import { cn, Input } from '@ogonggo/ui';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '@/entities/job/model/labels';
import type { JobEmploymentType, JobExperienceType } from '@/entities/job/model/types';
import { ChevronIcon, SearchIcon } from '@/shared/ui/icons';
import { buildJobListHref, type JobListQuery } from '../lib/query';

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
 */
function FilterDropdown<TValue extends string>({
  label,
  selected,
  options,
  buildHref,
}: {
  label: string;
  selected?: TValue;
  options: [TValue, string][];
  buildHref: (value: TValue | undefined) => string;
}) {
  const currentLabel = options.find(([value]) => value === selected)?.[1] ?? label;

  return (
    <details className="group relative">
      <summary
        className={cn(
          'flex h-9 cursor-pointer list-none items-center gap-1 rounded-full border px-3 text-sm font-medium [&::-webkit-details-marker]:hidden',
          selected ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-600',
        )}
      >
        {currentLabel}
        <ChevronIcon className="h-4 w-4 text-gray-400 group-open:rotate-180" />
      </summary>
      <ul className="absolute right-0 z-10 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-md">
        <li>
          <Link
            href={buildHref(undefined)}
            className={cn('block px-3 py-1.5 text-sm', !selected ? 'font-semibold text-blue-600' : 'text-gray-600 hover:bg-gray-50')}
          >
            {label}
          </Link>
        </li>
        {options.map(([value, optionLabel]) => (
          <li key={value}>
            <Link
              href={buildHref(value)}
              className={cn(
                'block px-3 py-1.5 text-sm',
                value === selected ? 'font-semibold text-blue-600' : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {optionLabel}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * 검색어는 자유 텍스트라 `<Link>` 이동으로는 못 만든다 — `<form method="GET">` + 제출 버튼(검색
 * 아이콘)은 유지한다. 채용형태·경력 드롭다운은 `FilterDropdown`으로 클릭 즉시 적용된다.
 */
export function SearchFilterBar({ query }: SearchFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action="/" method="GET" className="relative min-w-[220px] flex-1">
        <input type="hidden" name="sort" value={query.sort} />
        {query.employmentType ? (
          <input type="hidden" name="employmentType" value={query.employmentType} />
        ) : null}
        {query.experienceType ? (
          <input type="hidden" name="experienceType" value={query.experienceType} />
        ) : null}
        <Input
          type="text"
          name="q"
          defaultValue={query.q}
          placeholder="공고 검색"
          className="h-9 pl-9"
        />
        <button
          type="submit"
          aria-label="검색"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </form>
      <FilterDropdown
        label="채용 형태"
        selected={query.employmentType}
        options={EMPLOYMENT_TYPE_OPTIONS}
        buildHref={(value) => buildJobListHref(query, { employmentType: value })}
      />
      <FilterDropdown
        label="경력"
        selected={query.experienceType}
        options={EXPERIENCE_TYPE_OPTIONS}
        buildHref={(value) => buildJobListHref(query, { experienceType: value })}
      />
    </div>
  );
}
