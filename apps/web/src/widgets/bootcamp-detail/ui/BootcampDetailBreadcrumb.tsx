import { ChevronIcon } from '@/shared/ui/icons';
import { ListReturnLink } from '@/shared/ui/ListReturnLink';

/**
 * 상세 페이지 상단 "‹ 교육·부트캠프 목록" — 마지막으로 본 목록(쪽·탭·검색어·정렬 그대로)으로 돌아가는 링크.
 * 목록을 본 적이 없으면 `/bootcamps` 다. 채용공고 상세의 `JobDetailBreadcrumb`과 같은 모양이고 링크
 * 대상과 문구만 다르다.
 */
export function BootcampDetailBreadcrumb() {
  return (
    <ListReturnLink
      kind="bootcamps"
      fallback="/bootcamps"
      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
    >
      <ChevronIcon direction="left" className="h-4 w-4" />
      교육·부트캠프 목록
    </ListReturnLink>
  );
}
