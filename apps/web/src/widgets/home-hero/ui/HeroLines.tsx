import { cn } from '@ogonggo/ui';
import type { HeroSegment } from '@/shared/lib/heroContent';

export interface HeroLinesProps {
  lines: HeroSegment[][];
  /** 강조 조각의 글자색 클래스. 화면 테마(`HeroTheme.accentText`)에서 온다. */
  accentClassName?: string;
  /** 자리는 잡되 감출 줄의 번호. 서버가 아직 모르는 줄(로그인한 사람 이름)을 깜빡이지 않게 둔다. */
  hiddenLines?: number[];
}

/** 히어로 헤드라인의 줄들. 서버(`HomeHero`)와 클라이언트(`JobsHeroHeadline`)가 같이 그린다. */
export function HeroLines({
  lines,
  accentClassName = 'text-[#1BC47D]',
  hiddenLines = [],
}: HeroLinesProps) {
  return lines.map((line, lineIndex) => (
    <span key={lineIndex} className={cn('block', hiddenLines.includes(lineIndex) && 'invisible')}>
      {line.map((segment, segmentIndex) =>
        segment.accent ? (
          <span
            key={segmentIndex}
            className={cn(
              'inline-block text-[1.2em] leading-none',
              accentClassName,
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
