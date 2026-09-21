import { useId } from 'react';
import type { ComponentPropsWithoutRef, SVGProps } from 'react';
import { cn } from '@ogonggo/ui';

/**
 * 아이콘은 Iconify 로 그린다(`packages/ui/src/styles/tokens.css` 의 `@plugin "@iconify/tailwind4"`).
 * 플러그인이 소스에 적힌 `icon-[lucide--search]` 꼴의 문자열을 스캔해서 그 아이콘만 CSS 마스크로
 * 뽑으므로 이름을 변수로 조립하면 안 된다 — 항상 클래스 문자열 안에 그대로 적는다. 설명에 쓰는
 * 예시도 실제로 쓰는 이름이어야 한다. 없는 이름을 적어 두면 빌드가 `Invalid icon name` 을 뱉는다.
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
 *
 * 예외가 하나 있다. `BookmarkIcon` 은 인라인 `<svg>` 다 — 이유는 그 컴포넌트 주석에 적었다.
 */

export type IconProps = ComponentPropsWithoutRef<'span'>;

export function SearchIcon({ className, ...props }: IconProps) {
  return (
    <span aria-hidden="true" className={cn('icon-[lucide--search] block', className)} {...props} />
  );
}

export interface BookmarkIconProps extends SVGProps<SVGSVGElement> {
  filled?: boolean;
}

/** `state=off.svg` 의 윤곽선 패스. 안쪽이 비어 있어 뒤의 썸네일이 비친다 — 그것이 디자인이다. */
const BOOKMARK_OUTLINE_PATH =
  'M17.25 2H6.75C6.02106 2.00132 5.32236 2.29148 4.80692 2.80692C4.29148 3.32236 4.00132 4.02106 4 4.75V20.75C4 21.01 4.135 21.25 4.35 21.385C4.57 21.52 4.845 21.535 5.075 21.425L12 18.085L18.925 21.425C19.0393 21.4803 19.1659 21.5056 19.2927 21.4986C19.4195 21.4916 19.5424 21.4525 19.65 21.385C19.7579 21.3181 19.8468 21.2245 19.9081 21.1133C19.9694 21.0021 20.001 20.877 20 20.75V4.75C19.9987 4.02106 19.7085 3.32236 19.1931 2.80692C18.6776 2.29148 17.9789 2.00132 17.25 2ZM18.5 19.555L12 16.415L5.5 19.555V4.75C5.5 4.06 6.06 3.5 6.75 3.5H17.25C17.94 3.5 18.5 4.06 18.5 4.75V19.555Z';

/** `state=on.svg` 의 채운 패스. */
const BOOKMARK_FILLED_PATH =
  'M18 2H6C4.9 2 4 2.9 4 4V21C4 21.36 4.19 21.69 4.5 21.87C4.81 22.05 5.19 22.05 5.5 21.87L12 18.15L18.5 21.87C18.65 21.96 18.83 22 19 22C19.17 22 19.35 21.96 19.5 21.87C19.81 21.69 20 21.36 20 21V4C20 2.9 19.1 2 18 2Z';

/**
 * 북마크 아이콘. `filled` 가 정하는 것은 생김새뿐이고, 누를 수 있게 만드는 것은 이것을 감싸는
 * `features/bookmark` 의 버튼 둘(`BookmarkButton`, `BookmarkCountButton`)이다.
 *
 * 이 아이콘만 Iconify 가 아니라 인라인 SVG 다(`docs/asset/v3-1/bookmark/state=off.svg`,
 * `state=on.svg`). Iconify 는 아이콘을 `mask-image` 로 그리는데 마스크는 단색 실루엣이라
 * **그림자를 살릴 수 없다.** 비운 상태의 안쪽은 새 에셋에서도 비어 있고, 사진 위에서 윤곽을
 * 읽히게 하는 것은 흰 면이 아니라 그 그림자다. 그림자가 이 아이콘의 핵심이므로 마스크로는 못
 * 그린다.
 *
 * 색을 `currentColor` 로 바꾸지 않는다. 두 상태의 색(`#D1D5DB`, `#4A76FF`)이 에셋에 박혀 있고
 * 그것이 디자인이다. 크기와 자리는 전과 같이 쓰는 쪽의 클래스가 정한다.
 *
 * `filter` 영역은 두 에셋이 각각 27.4997 과 28.005 인데 하나로 합쳤다. `clipPath` 가 어차피
 * 24x24 로 자르므로 충분히 크기만 하면 결과가 같다.
 *
 * `filter`·`clipPath` 의 `id` 는 인스턴스마다 다르다. 카드 목록 한 화면에 이 아이콘이 열
 * 몇 개씩 나오는데 `id` 는 문서에서 유일해야 하고, 겹치면 브라우저가 첫 정의만 쓴다. `useId`
 * 는 서버 컴포넌트에서도 동작하고 서버·클라이언트가 같은 값을 준다. 콜론 같은 글자를 빼는
 * 것은 `url(#...)` 참조로 들어가기 때문이다.
 */
export function BookmarkIcon({ filled = false, className, ...props }: BookmarkIconProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const shadowId = `bookmark-shadow-${instanceId}`;
  const clipId = `bookmark-clip-${instanceId}`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('block', className)}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <g filter={`url(#${shadowId})`}>
          <path
            d={filled ? BOOKMARK_FILLED_PATH : BOOKMARK_OUTLINE_PATH}
            fill={filled ? '#4A76FF' : '#D1D5DB'}
          />
        </g>
      </g>
      <defs>
        <filter
          id={shadowId}
          x="0"
          y="-2"
          width="24"
          height="28"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.152941 0 0 0 0 0.152941 0 0 0 0 0.176471 0 0 0 0.08 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        <clipPath id={clipId}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
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
