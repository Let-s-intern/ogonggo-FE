import Link from 'next/link';
import { cn } from '@ogonggo/ui';
import { ChevronIcon } from '@/shared/ui/icons';

export interface SortOption<TValue extends string> {
  value: TValue;
  label: string;
}

export interface SortToggleProps<TValue extends string> {
  options: SortOption<TValue>[];
  current: TValue;
  /**
   * 정렬 값 하나에 대한 링크 주소. 원래는 `query: JobListQuery`를 받아 안에서
   * `buildJobListHref`를 불렀는데, 그 함수가 경로를 `/`로 하드코딩하고 있어 `/bootcamps`에서
   * 쓸 수 없었다. 보존할 쿼리 파라미터와 옵션 목록은 목록마다 달라 호출부가 정한다.
   */
  buildHref: (value: TValue) => string;
}

/**
 * `home.png`·`교육부트캠프.png`의 "최신순 ▾" 드롭다운. 동작은 그대로 URL의 `sort` 쿼리
 * 파라미터 — 자바스크립트 없이 `<details>`/`<summary>`로 여닫고, 옵션은 진짜 `<Link>` 이동이다
 * (`buildHref`가 `page`를 생략하면 정렬을 바꿀 때 1페이지로 돌아간다).
 */
export function SortToggle<TValue extends string>({
  options,
  current,
  buildHref,
}: SortToggleProps<TValue>) {
  const currentLabel = options.find((option) => option.value === current)?.label ?? options[0]?.label;

  return (
    <details className="group relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-1 rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 [&::-webkit-details-marker]:hidden">
        {currentLabel}
        <ChevronIcon className="h-4 w-4 text-gray-400 group-open:rotate-180" />
      </summary>
      <ul className="absolute right-0 z-10 mt-1 w-24 rounded-md border border-gray-200 bg-white py-1 shadow-md">
        {options.map((option) => (
          <li key={option.value}>
            <Link
              href={buildHref(option.value)}
              className={cn(
                'block px-3 py-1.5 text-sm',
                option.value === current
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
