import Link from 'next/link';
import type { ListPublicConcernsSort } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import {
  CONCERN_CATEGORIES,
  CONCERN_CATEGORY_LABELS,
  CONCERN_SORT_LABELS,
  CONCERN_SORTS,
} from '@/entities/concern/model/labels';
import { SortToggle, type SortOption } from '@/shared/ui/SortToggle';
import { buildConcernListHref, type ConcernListQuery } from '../lib/query';
import { ConcernWriteButton } from './ConcernWriteButton';

/** 정렬 값과 문구는 `entities/concern/model/labels.ts`. 첫 값(`LATEST`)이 기본값이라 회색으로 보인다. */
const SORT_OPTIONS: SortOption<ListPublicConcernsSort>[] = CONCERN_SORTS.map((value) => ({
  value,
  label: CONCERN_SORT_LABELS[value],
}));

const CHIP_CLASS =
  'inline-flex h-9 items-center rounded-full border px-4 text-sm font-normal whitespace-nowrap transition-colors';

function CategoryChip({
  href,
  selected,
  children,
}: {
  href: string;
  selected: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        CHIP_CLASS,
        selected
          ? 'border-transparent bg-blue-500 font-medium text-white'
          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
      )}
    >
      {children}
    </Link>
  );
}

export interface ConcernListControlsProps {
  query: ConcernListQuery;
}

/**
 * `v13 취준고민/목록.webp` 의 목록 위 두 줄 — `고민 올리기` 버튼, 그 아래 왼쪽에 카테고리 칩과 오른쪽에
 * 정렬 드롭다운. 칩과 정렬은 자바스크립트 없이 주소의 쿼리를 바꾸는 `<Link>` 이고, 바꾸면 1쪽으로
 * 간다(`buildConcernListHref`).
 *
 * 시안은 버튼 왼쪽에 검색창이 있다. 목록 API 에 검색어 파라미터가 없어 그리지 않는다(PRD).
 */
export function ConcernListControls({ query }: ConcernListControlsProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex justify-end">
        <ConcernWriteButton className="gap-1.5 px-5">
          <span aria-hidden="true" className="icon-[lucide--plus] block h-4 w-4" />
          고민 올리기
        </ConcernWriteButton>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-2" aria-label="고민 주제">
          <CategoryChip
            href={buildConcernListHref(query, { category: undefined })}
            selected={query.category === undefined}
          >
            전체
          </CategoryChip>
          {CONCERN_CATEGORIES.map((category) => (
            <CategoryChip
              key={category}
              href={buildConcernListHref(query, { category })}
              selected={query.category === category}
            >
              {CONCERN_CATEGORY_LABELS[category]}
            </CategoryChip>
          ))}
        </nav>
        <SortToggle
          options={SORT_OPTIONS}
          current={query.sort}
          buildHref={(sort) => buildConcernListHref(query, { sort })}
        />
      </div>
    </div>
  );
}
