import { GetJobsSort } from '@ogonggo/api';
import { cn, Input } from '@ogonggo/ui';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '@/entities/job/model/labels';
import type { JobEmploymentType, JobExperienceType } from '@/entities/job/model/types';
import { ChevronIcon, SearchIcon } from '@/shared/ui/icons';

export interface SearchFilterBarProps {
  q?: string;
  employmentType?: JobEmploymentType;
  experienceType?: JobExperienceType;
  sort: GetJobsSort;
}

const EMPLOYMENT_TYPE_OPTIONS = Object.entries(EMPLOYMENT_TYPE_LABELS) as [
  JobEmploymentType,
  string,
][];
const EXPERIENCE_TYPE_OPTIONS = Object.entries(EXPERIENCE_TYPE_LABELS) as [
  JobExperienceType,
  string,
][];

function FilterSelect({
  name,
  placeholder,
  defaultValue,
  options,
}: {
  name: string;
  placeholder: string;
  defaultValue?: string;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        className={cn(
          'h-9 appearance-none rounded-full border border-gray-200 bg-white py-1 pl-3 pr-8 text-sm text-gray-600',
          'focus:border-blue-500 focus:outline-none',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <ChevronIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

/**
 * 자바스크립트 없이도 동작하는 네이티브 `<form method="GET">` — 셀렉트 변경만으로 자동 제출하지
 * 않고, 검색 아이콘(=submit 버튼)을 눌러 검색어·채용형태·경력을 한 번에 적용한다(Push 4 task
 * 파일 3.2 "확인 필요" 검토 결과: 네이티브 `<select>`가 URL 기반 폼 제출과 가장 적은 코드로
 * 맞는다). 현재 정렬은 hidden input으로 함께 제출해 유지하고, `page`는 폼에 없어 제출 시 자연스럽게
 * 1페이지로 초기화된다.
 */
export function SearchFilterBar({ q, employmentType, experienceType, sort }: SearchFilterBarProps) {
  return (
    <form action="/" method="GET" className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="sort" value={sort} />
      <div className="relative min-w-[220px] flex-1">
        <Input type="text" name="q" defaultValue={q} placeholder="공고 검색" className="h-9 pl-9" />
        <button
          type="submit"
          aria-label="검색"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </div>
      <FilterSelect
        name="employmentType"
        placeholder="채용 형태"
        defaultValue={employmentType}
        options={EMPLOYMENT_TYPE_OPTIONS}
      />
      <FilterSelect
        name="experienceType"
        placeholder="경력"
        defaultValue={experienceType}
        options={EXPERIENCE_TYPE_OPTIONS}
      />
    </form>
  );
}
