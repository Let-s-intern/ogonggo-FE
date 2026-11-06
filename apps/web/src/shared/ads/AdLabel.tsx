import { cn } from '@ogonggo/ui';

/**
 * 광고 공고 카드의 `광고` 표시(이슈 #573). 모든 자리에서 같은 모양이고, 회사명 바로 앞에 둔다 — 카드는 일반 카드 그대로라
 * 이것 하나로 광고임을 밝힌다. 회사명이 길어 줄어도 이 글자는 줄지 않는다.
 */
export function AdLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded bg-gray-100 px-1 py-0.5 text-[11px] leading-none font-medium text-gray-500',
        className,
      )}
    >
      광고
    </span>
  );
}
