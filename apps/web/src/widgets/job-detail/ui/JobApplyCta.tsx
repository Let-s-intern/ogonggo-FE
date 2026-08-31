import { Button } from '@ogonggo/ui';
import { BookmarkIcon } from '@/shared/ui/icons';

export interface JobApplyCtaProps {
  sourceUrl?: string;
  bookmarked: boolean;
  bookmarkCount: number;
}

/**
 * 사이드바 CTA — "지원하러 가기"(`sourceUrl` 없으면 버튼 자체를 숨기는 기존 동작 유지, Push 3의
 * "원문 보기" 버튼을 이 스타일로 옮긴 것) + 북마크 아이콘·카운트(`bookmarkCount`, 표시 전용,
 * 클릭해도 상태가 바뀌지 않는다, PRD 7절).
 */
export function JobApplyCta({ sourceUrl, bookmarked, bookmarkCount }: JobApplyCtaProps) {
  return (
    <div className="flex items-center gap-2">
      {sourceUrl ? (
        <Button asChild className="flex-1">
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            지원하러 가기
          </a>
        </Button>
      ) : null}
      <div className="flex h-11 flex-col items-center justify-center rounded-m border border-gray-300 px-3 text-xs text-gray-500">
        <BookmarkIcon filled={bookmarked} className="h-4 w-4" />
        <span>{bookmarkCount}</span>
      </div>
    </div>
  );
}
