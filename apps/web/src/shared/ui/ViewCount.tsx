import { cn } from '@ogonggo/ui';
import { EyeIcon } from './icons';

/**
 * 카드의 조회수(눈 아이콘 + 숫자). 천 단위 쉼표를 붙인다(`3,402`). 자리는 부르는 쪽이 `className` 으로
 * 정한다 — 공고·부트캠프 카드는 맨 아래 줄 오른쪽 끝이다.
 */
export function ViewCount({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cn('flex shrink-0 items-center gap-1 text-xs text-gray-400', className)}>
      <EyeIcon className="size-3.5" />
      <span className="sr-only">조회수</span>
      {count.toLocaleString('ko-KR')}
    </span>
  );
}
