import Link from 'next/link';
import { ChevronIcon } from '@/shared/ui/icons';

/**
 * 상세 상단 "‹ 취준 고민" — 목록(`/concerns`)으로 돌아가는 링크. `SideStudyDetailBreadcrumb` 과 같은
 * 모양이다. 모바일 시안(`모바일 상세.webp`)에는 이 줄이 없어서 `md` 부터 보인다.
 */
export function ConcernDetailBreadcrumb() {
  return (
    <Link
      href="/concerns"
      className="hidden items-center gap-1 text-sm text-gray-500 hover:text-gray-700 md:flex"
    >
      <ChevronIcon direction="left" className="h-4 w-4" />
      취준 고민
    </Link>
  );
}
