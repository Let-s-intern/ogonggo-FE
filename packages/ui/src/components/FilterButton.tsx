import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

/*
 * 세 상태. 색은 `docs/asset/v3-1/filter/` 세 장에서 픽셀로 읽었다(2026-09-21).
 *
 * | 상태 | 에셋 | 테두리 | 배경 | 글자·꺾쇠 |
 * |---|---|---|---|---|
 * | default | `image copy.png` | `#E5E7EB` | 없음 | `#9CA3AF` |
 * | open | `image copy 2.png` | `#4A76FF` | 없음 | `#4A76FF` |
 * | selected | `image.png` | 없음 | `#EBF1FF` | `#4A76FF` |
 *
 * 꺾쇠는 글자와 늘 같은 색이다(에셋 세 장 모두). 그래서 `currentColor` 로 두고 따로 칠하지
 * 않는다 — 지금 `SortToggle` 은 글자가 `gray-600` 인데 꺾쇠만 `gray-400` 이라 둘이 갈려 있다.
 *
 * `selected` 만 글자가 한 단계 굵다. 에셋의 잉크 면적이 기본의 1.33 배인데, 같은 글꼴로 그린
 * 크롬에서 400 대비 600 이 1.34 배다(500 은 1.17 배라 모자란다). 글자 폭도 기본보다 넓어
 * `l` 과 `t` 가 붙는다.
 */
const STATE_CLASSES = {
  default: 'border-gray-200 text-gray-400',
  open: 'border-blue-500 text-blue-500',
  selected: 'border-transparent bg-blue-50 font-semibold text-blue-500',
} as const;

export interface FilterButtonProps extends HTMLAttributes<HTMLElement> {
  state?: keyof typeof STATE_CLASSES;
}

/**
 * 꺾쇠 달린 드롭다운 트리거(`docs/asset/v3-1/filter/`).
 *
 * **트리거 한 칸만 그린다.** 여닫는 `<details>` 껍데기와 드롭다운 목록은 쓰는 쪽에 남는다
 * (PRD 5 절, `.claude/tasks/memos/결정-목록컨트롤-컴포넌트화-2026-09-21.md`). `FilterDropdown`
 * 과 `SortToggle` 은 목록의 내용도 링크를 만드는 규칙도 서로 달라, 껍데기까지 들이면 두
 * 호출부의 차이를 이 파일이 떠안는다. 에셋이 그린 것도 트리거 한 칸이다.
 *
 * 그래서 `<summary>` 를 돌려준다. 이것이 대신할 자리가 두 호출부의 `<summary>` 이고,
 * `list-none` 과 `::-webkit-details-marker` 는 그 자리에 원래 붙어 있던 것이다.
 *
 * `state` 는 쓰는 쪽이 정한다. `<details>` 의 열림은 CSS(`group-open:`) 로도 알 수 있지만,
 * `selected`(고른 값이 있음) 는 CSS 로 알 수 없어 어차피 쓰는 쪽이 넘겨야 한다. 한 컨트롤의
 * 상태를 두 경로로 정하면 둘이 어긋났을 때 어느 쪽이 이기는지가 클래스 순서에 달리게 된다.
 */
export const FilterButton = forwardRef<HTMLElement, FilterButtonProps>(
  ({ className, state = 'default', children, ...props }, ref) => (
    <summary
      ref={ref}
      className={cn(
        'flex h-9 cursor-pointer list-none items-center gap-1 rounded-full border px-4',
        'text-sm font-normal [&::-webkit-details-marker]:hidden',
        STATE_CLASSES[state],
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'icon-[lucide--chevron-down] block h-4 w-4 shrink-0 transition-transform',
          state === 'open' && 'rotate-180',
        )}
      />
    </summary>
  ),
);
FilterButton.displayName = 'FilterButton';
