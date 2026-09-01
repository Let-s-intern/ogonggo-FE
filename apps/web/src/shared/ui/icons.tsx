import type { SVGProps } from 'react';
import { cn } from '@ogonggo/ui';

/**
 * 이 저장소에 아이콘 라이브러리가 없다(Push 4 task 파일 "관련 파일" 참고) — 필요한 몇 개만
 * 인라인 SVG로 직접 그린다. 업무 의미가 없는 범용 그래픽이라 `shared/ui`에 둔다.
 */

/** `home.png` 히어로 배지 앞의 위치 핀 아이콘. */
export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 18C10 18 16 12.5 16 8A6 6 0 0 0 4 8C4 12.5 10 18 10 18Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 17L13.4 13.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export interface BookmarkIconProps extends SVGProps<SVGSVGElement> {
  filled?: boolean;
}

/** `job.bookmarked`를 그대로 반영하는 표시 전용 아이콘 — 클릭해도 상태가 바뀌지 않는다(PRD 7절). */
export function BookmarkIcon({ filled = false, className, ...props }: BookmarkIconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn(filled ? 'text-blue-500' : 'text-gray-300', className)}
      {...props}
    >
      <path
        d="M5 3.5C5 3.22386 5.22386 3 5.5 3H14.5C14.7761 3 15 3.22386 15 3.5V17L10 13.5L5 17V3.5Z"
        fill={filled ? 'currentColor' : 'white'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 상세 헤더의 조회수(`viewCount`) 표시에 쓰는 눈 모양 아이콘. */
export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1.5 10C1.5 10 4.5 4.5 10 4.5C15.5 4.5 18.5 10 18.5 10C18.5 10 15.5 15.5 10 15.5C4.5 15.5 1.5 10 1.5 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export type ChevronDirection = 'up' | 'down' | 'left' | 'right';

const CHEVRON_ROTATION: Record<ChevronDirection, string> = {
  down: 'rotate-0',
  up: 'rotate-180',
  left: 'rotate-90',
  right: '-rotate-90',
};

export interface ChevronIconProps extends SVGProps<SVGSVGElement> {
  direction?: ChevronDirection;
}

export function ChevronIcon({ direction = 'down', className, ...props }: ChevronIconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={cn(CHEVRON_ROTATION[direction], className)}
      {...props}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 사이드·스터디 카드 하단의 댓글 수(`commentCount`) 앞에 붙는 말풍선 아이콘. */
export function CommentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 5.5C3 4.67157 3.67157 4 4.5 4H15.5C16.3284 4 17 4.67157 17 5.5V12.5C17 13.3284 16.3284 14 15.5 14H8L4.5 17V14H4.5C3.67157 14 3 13.3284 3 12.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
