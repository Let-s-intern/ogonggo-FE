import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

/*
 * 세 상태. 색은 `docs/asset/v3-1/menu/` 세 장에서 픽셀로 읽었다(2026-09-21).
 *
 * | 상태 | 에셋 | 글자 | 밑줄 |
 * |---|---|---|---|
 * | default | `image copy.png` | `#6B7280` | 없음 |
 * | active | `image copy 2.png` | `#374151` | 없음 |
 * | current | `image.png` | `#030712` | `#030712` 1.5px |
 *
 * **세 장의 글자가 굵기까지 똑같다.** 에셋 셋의 글자 부분은 잉크 면적(781.0)도 글자 상자
 * (x 2..81, y 25..48)도 획 굵기(가운데 줄 실행 길이 `4,4,4,3,15,4,4,4,3`)도 완전히 같고,
 * `current` 만 아래쪽 세 줄(1.5px) 의 밑줄이 더 있다. PRD 5 절은 `active`·`current` 를
 * "진한 굵은 글자" 라고 적었는데 굵어지는 것은 아니었다 — 굵기는 그대로고 색이 두 단계
 * 진해진다. 에셋을 따른다. 판단 근거는
 * `.claude/tasks/memos/결정-menuitem-굵기-2026-09-21.md`.
 */
const STATE_CLASSES = {
  default: 'border-transparent text-gray-500',
  active: 'border-transparent text-gray-700',
  current: 'border-gray-950 text-gray-950',
} as const;

export interface MenuItemProps extends HTMLAttributes<HTMLSpanElement> {
  state?: keyof typeof STATE_CLASSES;
}

/**
 * 글자만 있는 메뉴 항목(`docs/asset/v3-1/menu/`). 목록 화면의 탭 줄과 헤더 내비게이션이 쓴다.
 *
 * **`<span>` 을 돌려주고 `<Link>` 로 감싸는 것은 쓰는 쪽이 한다.** `packages/ui` 는
 * `next/link` 를 모른다 — 스토리북이 `.storybook/next-link.tsx` 스텁으로 때우고 있어서,
 * 링크를 안으로 들이면 그 스텁이 진짜 의존이 된다(PRD 5 절).
 *
 * 밑줄은 `text-decoration` 이 아니라 아래 테두리다. 글자에 붙는 밑줄은 글꼴이 정한 자리에
 * 그려지지만 에셋의 선은 36px 상자의 맨 아래에 있고 글자 폭 전체를 지난다. 고르지 않은 항목도
 * 같은 자리에 투명한 선을 둬야 상태가 바뀔 때 글자가 위아래로 움직이지 않는다.
 *
 * 두께 1.5px 은 에셋 값이다(2x 로 그린 그림에서 3픽셀). `border-b-2` 로 올리면 4픽셀이 된다.
 */
export const MenuItem = forwardRef<HTMLSpanElement, MenuItemProps>(
  ({ className, state = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex h-9 items-center border-b-[1.5px] text-base font-medium',
        STATE_CLASSES[state],
        className,
      )}
      {...props}
    />
  ),
);
MenuItem.displayName = 'MenuItem';
