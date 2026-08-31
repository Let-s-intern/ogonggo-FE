import Link from 'next/link';
import type { PageInfo } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { ChevronIcon, type ChevronDirection } from '@/shared/ui/icons';
import { buildJobListHref, type JobListQuery } from '../lib/query';
import { computePageWindow } from '../lib/pageWindow';

export interface NumberedPaginationProps {
  pageInfo: PageInfo;
  query: JobListQuery;
}

function PageArrow({
  href,
  disabled,
  direction,
  double = false,
  label,
}: {
  href: string;
  disabled: boolean;
  direction: ChevronDirection;
  double?: boolean;
  label: string;
}) {
  const icon = (
    <span className="flex">
      <ChevronIcon direction={direction} className="h-4 w-4" />
      {double ? <ChevronIcon direction={direction} className="-ml-2 h-4 w-4" /> : null}
    </span>
  );

  if (disabled) {
    return (
      <span aria-label={label} className="flex h-8 w-8 items-center justify-center text-gray-300">
        {icon}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-m text-gray-500 hover:bg-gray-50"
    >
      {icon}
    </Link>
  );
}

/**
 * `home.png`의 번호 페이지네이션(처음/이전/`1 2 3 … 15`/다음/끝). 경계(첫/끝 페이지)에서는
 * `Pagination`(이전 구현)과 같은 방식으로 비활성 `<span>`을 보여준다. 링크는
 * `buildJobListHref`로 `q`/`employmentType`/`experienceType`/`sort`를 그대로 보존한다.
 */
export function NumberedPagination({ pageInfo, query }: NumberedPaginationProps) {
  const { pageNum } = pageInfo;
  const totalPages = Math.max(pageInfo.totalPages, 1);
  const hasPrev = pageNum > 1;
  const hasNext = pageNum < totalPages;
  const pageItems = computePageWindow(pageNum, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="페이지 이동">
      <PageArrow
        href={buildJobListHref(query, { page: 1 })}
        disabled={!hasPrev}
        direction="left"
        double
        label="처음"
      />
      <PageArrow
        href={buildJobListHref(query, { page: pageNum - 1 })}
        disabled={!hasPrev}
        direction="left"
        label="이전"
      />
      {pageItems.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildJobListHref(query, { page: item })}
            aria-current={item === pageNum ? 'page' : undefined}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-m text-sm font-medium',
              item === pageNum ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            {item}
          </Link>
        ),
      )}
      <PageArrow
        href={buildJobListHref(query, { page: pageNum + 1 })}
        disabled={!hasNext}
        direction="right"
        label="다음"
      />
      <PageArrow
        href={buildJobListHref(query, { page: totalPages })}
        disabled={!hasNext}
        direction="right"
        double
        label="끝"
      />
    </nav>
  );
}
