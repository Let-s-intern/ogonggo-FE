import { cn } from '@ogonggo/ui';
import type { HeroSegment } from '@/shared/lib/heroContent';

/** 히어로 헤드라인의 줄들. 서버(`HomeHero`)와 클라이언트(`JobsHeroHeadline`)가 같이 그린다. */
export function HeroLines({
  lines,
  hiddenLines = [],
}: {
  lines: HeroSegment[][];
  hiddenLines?: number[];
}) {
  return lines.map((line, lineIndex) => (
    <span key={lineIndex} className={cn('block', hiddenLines.includes(lineIndex) && 'invisible')}>
      {line.map((segment, segmentIndex) =>
        segment.accent ? (
          <span
            key={segmentIndex}
            className={cn(
              'inline-block text-[1.2em] leading-none text-[#1BC47D]',
              segment.tilted && 'mx-[0.1em] -translate-y-[0.15em] rotate-[10deg]',
            )}
          >
            {segment.text}
          </span>
        ) : (
          segment.text
        ),
      )}
    </span>
  ));
}
