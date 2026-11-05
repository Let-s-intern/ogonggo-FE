import { cn } from '@ogonggo/ui';

/**
 * 등록 24시간 안 공고(`isNewJob`)의 제목 앞에 붙는 주황 동그라미 `N`(2026-11-05 사용자 시안). 크기는 부르는 쪽이
 * `className` 으로 정한다 — 카드는 제목 글자보다 작게(`size-4`) 둔다. 읽는 사람에게는 `새 공고` 로 들린다.
 */
export function NewJobMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] leading-none font-extrabold text-white',
        className,
      )}
    >
      <span aria-hidden="true">N</span>
      <span className="sr-only">새 공고</span>
    </span>
  );
}
