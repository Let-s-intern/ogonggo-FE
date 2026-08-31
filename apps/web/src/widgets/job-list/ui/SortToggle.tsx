import Link from 'next/link';
import { cn } from '@ogonggo/ui';
import { GetJobsSort } from '@ogonggo/api';

const OPTIONS: { value: GetJobsSort; label: string }[] = [
  { value: GetJobsSort.LATEST, label: '최신순' },
  { value: GetJobsSort.VIEW_COUNT, label: '조회순' },
];

export interface SortToggleProps {
  sort: GetJobsSort;
}

/** URL의 `sort` 쿼리 파라미터로 정렬 상태를 갖는다. 정렬을 바꾸면 1페이지로 돌아간다. */
export function SortToggle({ sort }: SortToggleProps) {
  return (
    <div className="flex gap-2 self-start">
      {OPTIONS.map((option) => (
        <Link
          key={option.value}
          href={option.value === GetJobsSort.LATEST ? '/' : `/?sort=${option.value}`}
          className={cn(
            'rounded-s px-3 py-1 text-sm font-medium',
            sort === option.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600',
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
