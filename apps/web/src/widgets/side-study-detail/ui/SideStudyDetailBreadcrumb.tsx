import Link from 'next/link';
import { ChevronIcon } from '@/shared/ui/icons';

/**
 * 상세 페이지 상단 "‹ 사이드·스터디 목록" — 목록(`/side-studies`)으로 돌아가는 링크.
 * `JobDetailBreadcrumb`·`BootcampDetailBreadcrumb`과 같은 모양이고 링크 대상과 문구만 다르다.
 *
 * 목업(`사이드스터디 상세페이지.png`)의 이 자리는 "교육·부트캠프 목록"이라고 적혀 있고 헤더
 * 밑줄도 `교육 · 부트캠프`에 있는데, 부트캠프 상세 목업을 복사해 만든 흔적이다. 사이드·스터디
 * 상세에서 돌아갈 목록은 `/side-studies`이므로 그쪽으로 건다.
 */
export function SideStudyDetailBreadcrumb() {
  return (
    <Link
      href="/side-studies"
      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
    >
      <ChevronIcon direction="left" className="h-4 w-4" />
      사이드·스터디 목록
    </Link>
  );
}
