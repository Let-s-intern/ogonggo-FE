import { Button } from '@ogonggo/ui';
import { BookmarkIcon } from '@/shared/ui/icons';

export interface ApplyCtaProps {
  /** 지원·신청 링크. 없으면 버튼 자체를 그리지 않고 북마크 칸만 남는다. */
  href?: string;
  /** 채용공고는 "지원하러 가기", 부트캠프는 "신청하러 가기"다(목업 문구). */
  label: string;
  bookmarked: boolean;
  bookmarkCount: number;
}

/**
 * 상세 사이드바 최상단 CTA — 버튼 + 북마크 아이콘·카운트(표시 전용, 클릭해도 상태가 바뀌지
 * 않는다, PRD 8절).
 *
 * 원래 `widgets/job-detail/ui/JobApplyCta.tsx`였다. 부트캠프 상세가 문구와 링크만 다른 같은
 * 것을 쓰게 되어(`교육부트캠프 상세페이지.png`의 "신청하러 가기") 호출부가 둘이 된 지금
 * 여기로 옮겼다(PRD 7절 — 두 곳 이상일 때만 옮긴다).
 */
export function ApplyCta({ href, label, bookmarked, bookmarkCount }: ApplyCtaProps) {
  return (
    <div className="flex items-center gap-2">
      {href ? (
        <Button asChild className="flex-1">
          <a href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        </Button>
      ) : null}
      <div className="flex h-11 flex-col items-center justify-center rounded-md border border-gray-300 px-3 text-xs text-gray-500">
        <BookmarkIcon filled={bookmarked} className="h-4 w-4" />
        <span>{bookmarkCount}</span>
      </div>
    </div>
  );
}
