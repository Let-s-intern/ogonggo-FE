import Link from 'next/link';
import type { PageInfo } from '@ogonggo/api';
import { cn, computePageBlock } from '@ogonggo/ui';
import { ChevronIcon, type ChevronDirection } from '@/shared/ui/icons';

export interface NumberedPaginationProps {
  pageInfo: PageInfo;
  /**
   * 페이지 번호 하나에 대한 링크 주소. 원래는 `query: JobListQuery`를 받아 안에서
   * `buildJobListHref`를 불렀는데, 그 함수가 경로를 `/`로 하드코딩하고 있어 `/bootcamps`에서
   * 쓸 수 없었다. 어떤 쿼리 파라미터를 보존할지는 목록마다 다르므로 호출부가 정한다.
   */
  buildHref: (page: number) => string;
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
      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
    >
      {icon}
    </Link>
  );
}

/**
 * 목록 아래 번호 페이지네이션(처음/이전/`1 2 3 … 10`/다음/끝).
 *
 * 번호는 10개씩 묶여 나오고 `이전`·`다음`은 묶음 단위로 움직인다. 계산은 `@ogonggo/ui`의
 * `computePageBlock` 한 곳에 있고 admin이 쓰는 버튼판 `Pagination`도 같은 함수를 쓴다.
 * 예전에는 양쪽이 접는 칸 수를 따로 정해(1칸 대 2칸) 두 앱의 페이징이 다르게 생겼다.
 *
 * `처음`·`끝`은 묶음과 무관하게 언제나 1페이지와 마지막 페이지다.
 * 검색·필터·정렬 상태를 링크에 보존하는 일은 `buildHref`를 넘기는 쪽 몫이다.
 */
export function NumberedPagination({ pageInfo, buildHref }: NumberedPaginationProps) {
  const { pageNum } = pageInfo;
  const totalPages = Math.max(pageInfo.totalPages, 1);
  const hasPrev = pageNum > 1;
  const hasNext = pageNum < totalPages;
  const { pages, previousBlockPage, nextBlockPage } = computePageBlock(pageNum, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="페이지 이동">
      <PageArrow href={buildHref(1)} disabled={!hasPrev} direction="left" double label="처음" />
      <PageArrow
        href={buildHref(previousBlockPage ?? 1)}
        disabled={previousBlockPage === null}
        direction="left"
        label="이전"
      />
      {pages.map((item) => (
        <Link
          key={item}
          href={buildHref(item)}
          aria-current={item === pageNum ? 'page' : undefined}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium',
            item === pageNum ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50',
          )}
        >
          {item}
        </Link>
      ))}
      <PageArrow
        href={buildHref(nextBlockPage ?? totalPages)}
        disabled={nextBlockPage === null}
        direction="right"
        label="다음"
      />
      <PageArrow
        href={buildHref(totalPages)}
        disabled={!hasNext}
        direction="right"
        double
        label="끝"
      />
    </nav>
  );
}
