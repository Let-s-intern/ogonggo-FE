import { cn } from '@ogonggo/ui';
import { CommentIcon, EyeIcon } from '@/shared/ui/icons';

export interface ConcernStatsProps {
  viewCount: number;
  /** 남아 있는 답변 수. 답글은 세지 않는다. */
  commentCount: number;
  className?: string;
}

/** 조회수(눈)와 답변 수(말풍선). 천 단위 쉼표를 붙인다(`5,310`). */
export function ConcernStats({ viewCount, commentCount, className }: ConcernStatsProps) {
  return (
    <span className={cn('flex shrink-0 items-center gap-2 text-xs text-gray-400', className)}>
      <span className="flex items-center gap-1">
        <EyeIcon className="h-3.5 w-3.5" />
        <span className="sr-only">조회수</span>
        {viewCount.toLocaleString('ko-KR')}
      </span>
      <span className="flex items-center gap-1">
        <CommentIcon className="h-3.5 w-3.5" />
        <span className="sr-only">답변</span>
        {commentCount.toLocaleString('ko-KR')}
      </span>
    </span>
  );
}
