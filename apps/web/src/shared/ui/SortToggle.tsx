import Link from 'next/link';
import { cn, FilterButton } from '@ogonggo/ui';

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
  /** 트리거의 이름. 뒤에 괄호로 지금 값을 붙인다 — `정렬 기준(최신순)`. */
  label?: string;
}

/**
 * `home.png`·`교육부트캠프.png`의 "최신순 ▾" 드롭다운. 동작은 그대로 URL의 `sort` 쿼리
 * 파라미터 — 자바스크립트 없이 `<details>`/`<summary>`로 여닫고, 옵션은 진짜 `<Link>` 이동이다
 * (`buildHref`가 `page`를 생략하면 정렬을 바꿀 때 1페이지로 돌아간다).
 *
 * 트리거는 `FilterButton`이 그린다(`docs/asset/v3-1/filter/`). 드롭다운 표시 규칙은 사이트 전체가
 * 같다(2026-09-30, 사용자) — 기본값이 있는 드롭다운은 `정렬 기준(최신순)` 처럼 이름과 지금 값을
 * 함께 보이고, 기본값(첫 옵션)이면 회색(`default`), 다른 값을 고르면 파란 바탕(`selected`)이다.
 * 예전에는 늘 `default` 라 조회순을 골라도 켜졌는지 알 수 없었다.
 *
 * 꺾쇠 뒤집기는 `FilterDropdown`과 같은 방식이다 — `group-open:[&>span]:rotate-180`.
 */
export function SortToggle<TValue extends string>({
  options,
  current,
  buildHref,
  label = '정렬 기준',
}: SortToggleProps<TValue>) {
  const currentLabel =
    options.find((option) => option.value === current)?.label ?? options[0]?.label;
  const changed = current !== options[0]?.value;

  return (
    <details data-dropdown className="group relative">
      <FilterButton
        state={changed ? 'selected' : 'default'}
        // 기본값일 때만 흰 바탕을 깐다. 켜졌을 때 덮으면 선택됨의 파란 바탕이 지워진다.
        className={cn(!changed && 'bg-white', 'group-open:[&>span]:rotate-180')}
      >
        {label}({currentLabel})
      </FilterButton>
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
