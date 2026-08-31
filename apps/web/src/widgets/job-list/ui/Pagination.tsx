import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { GetJobsSort, type PageInfo } from '@ogonggo/api';

export interface PaginationProps {
  pageInfo: PageInfo;
  sort: GetJobsSort;
}

function buildHref(page: number, sort: GetJobsSort): string {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set('page', String(page));
  }
  if (sort !== GetJobsSort.LATEST) {
    params.set('sort', sort);
  }
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

/** `pageInfo`(`pageNum`/`totalPages`) 기준 이전/다음 네비게이션. 경계에서는 비활성 버튼을 보여준다. */
export function Pagination({ pageInfo, sort }: PaginationProps) {
  const { pageNum, totalPages } = pageInfo;
  const hasPrev = pageNum > 1;
  const hasNext = pageNum < totalPages;

  return (
    <div className="flex items-center justify-center gap-3">
      {hasPrev ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={buildHref(pageNum - 1, sort)}>이전</Link>
        </Button>
      ) : (
        <Button variant="secondary" size="sm" disabled>
          이전
        </Button>
      )}
      <span className="text-sm text-gray-500">
        {pageNum} / {Math.max(totalPages, 1)}
      </span>
      {hasNext ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={buildHref(pageNum + 1, sort)}>다음</Link>
        </Button>
      ) : (
        <Button variant="secondary" size="sm" disabled>
          다음
        </Button>
      )}
    </div>
  );
}
