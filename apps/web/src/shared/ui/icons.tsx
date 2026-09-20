import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@ogonggo/ui';

/**
 * 아이콘은 Iconify 로 그린다(`packages/ui/src/styles/tokens.css` 의 `@plugin "@iconify/tailwind4"`).
 * 플러그인이 소스에 적힌 `icon-[세트--이름]` 문자열을 스캔해서 그 아이콘만 CSS 마스크로 뽑으므로
 * 이름을 변수로 조립하면 안 된다 — 항상 클래스 문자열 안에 그대로 적는다.
 *
 * 그려지는 것은 `<svg>` 가 아니라 `background-color: currentColor` 를 마스크로 자른 `<span>` 이다.
 * 그래서 크기는 `width`/`height` 가 정하고(기본 `1em`), 색은 그대로 `text-*` 가 정한다. 쓰는 쪽이
 * 전부 `h-4 w-4` 같은 크기 클래스를 붙이고 있어서 교체 전후로 박스 크기와 자리가 같다.
 *
 * `block` 이 붙어 있는 이유. Tailwind preflight 가 `svg` 를 `display: block` 으로 만들어 두기
 * 때문에 전에는 모든 아이콘이 블록이었는데, Iconify 가 주는 클래스는 `display: inline-block` 이다.
 * 이 차이로 아이콘이 줄상자를 만들어 부모가 세로로 늘어났다(실측: `/calendar` 의 월 이동 화살표
 * `<a>` 가 32px → 39px, 문서 전체 높이 1477px → 1484px). `block` 을 같이 붙이면 전과 같다.
 *
 * 이 파일이 래퍼로 남는 이유는 두 가지다. 하나는 `BookmarkIcon`·`ChevronIcon` 처럼 상태나 방향이
 * 클래스 하나로 안 끝나는 것이 있어서고, 하나는 쓰는 곳이 열 곳이 넘어 이름을 한 군데서 바꾸기
 * 위해서다.
 */

export type IconProps = ComponentPropsWithoutRef<'span'>;

export function SearchIcon({ className, ...props }: IconProps) {
  return (
    <span aria-hidden="true" className={cn('icon-[lucide--search] block', className)} {...props} />
  );
}

export interface BookmarkIconProps extends IconProps {
  filled?: boolean;
}

/**
 * `job.bookmarked`를 그대로 반영하는 표시 전용 아이콘 — 클릭해도 상태가 바뀌지 않는다(PRD 7절).
 *
 * 세트가 `lucide` 가 아니라 `tabler` 다. PRD 2 절 표는 `lucide--bookmark` 에 "채운 것은 fill
 * 처리" 라고 적었지만 Iconify 는 아이콘을 마스크로 그리기 때문에 바깥에서 fill 을 줄 수단이
 * 없고, `lucide` 에는 채운 북마크가 없다(`bookmark`, `bookmark-check`, `bookmark-minus`,
 * `bookmark-off`, `bookmark-plus`, `bookmark-x` 가 전부다). `tabler` 는 `bookmark` 와
 * `bookmark-filled` 가 같은 실루엣(24 그리드, 2px 획, 바깥 테두리 x 5~19)이라 두 상태의 폭이
 * 어긋나지 않는다. 다른 세트의 채운 북마크를 빌려 오면 상태가 바뀔 때 아이콘 폭이 달라진다.
 *
 * 비운 상태의 속이 비쳐 보인다. 전에는 `fill="white"` 라 뒤의 썸네일을 가렸다. 마스크에는
 * 안쪽 면이 없어서 `BootcampCard` 처럼 사진 위에 얹히는 자리에서는 사진이 비친다.
 */
export function BookmarkIcon({ filled = false, className, ...props }: BookmarkIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        filled
          ? 'icon-[tabler--bookmark-filled] block text-blue-500'
          : 'icon-[tabler--bookmark] block text-gray-300',
        className,
      )}
      {...props}
    />
  );
}

/** 상세 헤더의 조회수(`viewCount`) 표시에 쓰는 눈 모양 아이콘. */
export function EyeIcon({ className, ...props }: IconProps) {
  return (
    <span aria-hidden="true" className={cn('icon-[lucide--eye] block', className)} {...props} />
  );
}

export type ChevronDirection = 'up' | 'down' | 'left' | 'right';

/**
 * 방향은 이름이 아니라 회전으로 낸다. `icon-[lucide--chevron-${direction}]` 처럼 조립하면
 * 플러그인 스캐너가 못 찾아서 아이콘이 통째로 사라진다.
 */
const CHEVRON_ROTATION: Record<ChevronDirection, string> = {
  down: 'rotate-0',
  up: 'rotate-180',
  left: 'rotate-90',
  right: '-rotate-90',
};

export interface ChevronIconProps extends IconProps {
  direction?: ChevronDirection;
}

export function ChevronIcon({ direction = 'down', className, ...props }: ChevronIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('icon-[lucide--chevron-down] block', CHEVRON_ROTATION[direction], className)}
      {...props}
    />
  );
}

/** 사이드·스터디 카드 하단의 댓글 수(`commentCount`) 앞에 붙는 말풍선 아이콘. */
export function CommentIcon({ className, ...props }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('icon-[lucide--message-circle] block', className)}
      {...props}
    />
  );
}

/** 날짜 이동 줄의 달력 아이콘(`docs/asset/공고달력 미니달력 모달.png`). */
export function CalendarIcon({ className, ...props }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('icon-[lucide--calendar] block', className)}
      {...props}
    />
  );
}

/** 오류 화면(`ErrorState`)의 원형 배지 안에 들어가는 느낌표. */
export function AlertIcon({ className, ...props }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('icon-[lucide--circle-alert] block', className)}
      {...props}
    />
  );
}

/** `다시 시도` 버튼의 새로고침 화살표. */
export function RefreshIcon({ className, ...props }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('icon-[lucide--refresh-cw] block', className)}
      {...props}
    />
  );
}

/** `홈으로` 버튼의 집 모양. */
export function HomeIcon({ className, ...props }: IconProps) {
  return (
    <span aria-hidden="true" className={cn('icon-[lucide--house] block', className)} {...props} />
  );
}

/** 목록으로 보내는 버튼의 줄 세 개. */
export function ListIcon({ className, ...props }: IconProps) {
  return (
    <span aria-hidden="true" className={cn('icon-[lucide--list] block', className)} {...props} />
  );
}

/** `로그인.png` 의 "일반 회원" 탭 앞 사람 모양. */
export function UserIcon({ className, ...props }: IconProps) {
  return (
    <span aria-hidden="true" className={cn('icon-[lucide--user] block', className)} {...props} />
  );
}

/** `로그인.png` 의 "기업 회원" 탭 앞 건물 모양. */
export function BuildingIcon({ className, ...props }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('icon-[lucide--building-2] block', className)}
      {...props}
    />
  );
}
