import { cn } from '@ogonggo/ui';

/** 광고 표시 `AD`. 광고 공고 카드와 배너에 붙는다(시안 U-01, `job-detail-pc.png`). */
export function AdLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded bg-gray-800/70 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white',
        className,
      )}
    >
      AD
    </span>
  );
}
