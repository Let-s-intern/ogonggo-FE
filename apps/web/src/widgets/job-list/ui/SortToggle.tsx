import Link from 'next/link';
import { cn } from '@ogonggo/ui';
import { GetJobsSort } from '@ogonggo/api';
import { ChevronIcon } from '@/shared/ui/icons';
import { buildJobListHref, type JobListQuery } from '../lib/query';

const OPTIONS: { value: GetJobsSort; label: string }[] = [
  { value: GetJobsSort.LATEST, label: '최신순' },
  { value: GetJobsSort.VIEW_COUNT, label: '조회순' },
];

export interface SortToggleProps {
  query: JobListQuery;
}

/**
 * `home.png`의 "최신순 ▾" 드롭다운. 동작은 그대로 URL의 `sort` 쿼리 파라미터 — 자바스크립트 없이
 * `<details>`/`<summary>`로 여닫고, 옵션은 `q`/`employmentType`/`experienceType`을 그대로 보존한
 * 진짜 `<Link>` 이동이다(정렬을 바꾸면 `buildJobListHref`가 `page`를 생략해 1페이지로 돌아간다).
 */
export function SortToggle({ query }: SortToggleProps) {
  const currentLabel =
    OPTIONS.find((option) => option.value === query.sort)?.label ?? OPTIONS[0]!.label;

  return (
    <details className="group relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-1 rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 [&::-webkit-details-marker]:hidden">
        {currentLabel}
        <ChevronIcon className="h-4 w-4 text-gray-400 group-open:rotate-180" />
      </summary>
      <ul className="absolute right-0 z-10 mt-1 w-24 rounded-md border border-gray-200 bg-white py-1 shadow-md">
        {OPTIONS.map((option) => (
          <li key={option.value}>
            <Link
              href={buildJobListHref(query, { sort: option.value })}
              className={cn(
                'block px-3 py-1.5 text-sm',
                option.value === query.sort
                  ? 'font-semibold text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
