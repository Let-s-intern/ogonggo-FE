import Link from 'next/link';
import { ChevronIcon } from '@/shared/ui/icons';

/**
 * 상세 페이지 상단 "‹ 채용공고 목록" — 목록(`/`)으로 돌아가는 링크. `ChevronIcon`은
 * `widgets/job-list/ui/NumberedPagination.tsx`가 이미 페이지네이션 화살표에 쓰던 것을 그대로
 * 재사용한다.
 */
export function JobDetailBreadcrumb() {
  return (
    <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
      <ChevronIcon direction="left" className="h-4 w-4" />
      채용공고 목록
    </Link>
  );
}
