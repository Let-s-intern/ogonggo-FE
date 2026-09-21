import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

/*
 * 톤 세 가지. 네 번째 상태인 `비활성화` 는 톤이 아니라 `disabled` 속성이 그린다 — 어느 톤이든
 * 끌 수 있어야 하고, 실제로 에셋의 비활성 그림은 톤과 무관하게 한 장뿐이다.
 *
 * 색은 `docs/asset/v3-1/chip/` 네 장에서 픽셀로 읽은 값이다(2026-09-21).
 * 블루 `#4A76FF`/`#F5F9FF`, 회색 `#F3F4F6`/`#6B7280` + 테두리 `#E5E7EB`, 투명 글자 `#111827`,
 * 비활성화 흰 바탕 + 테두리 `#E5E7EB` + 글자 `#9CA3AF`. 전부 토큰 안에 있는 이름이다.
 *
 * 테두리가 없는 톤에도 `border-transparent` 를 준다. `h-9` 는 border-box 라 높이는 어차피 같지만,
 * 테두리 유무로 안쪽 폭이 1px 씩 달라지면 칩을 나란히 놓았을 때 글자 자리가 어긋난다.
 */
const TONE_CLASSES = {
  blue: 'border-transparent bg-blue-500 text-blue-00',
  gray: 'border-gray-200 bg-gray-100 text-gray-500',
  ghost: 'border-transparent bg-transparent text-gray-900',
} as const;

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: keyof typeof TONE_CLASSES;
}

/**
 * 알약 모양 선택 칩(`docs/asset/v3-1/chip/`). 목록 화면 필터 줄에서 값 하나를 고르는 데 쓴다.
 *
 * 글자 무게는 `font-normal` 이다. 에셋의 잉크 면적을 같은 글꼴·같은 크기로 그린 크롬 결과와
 * 맞춰 보면 400 과 500 사이에서 400 쪽이다(실측 2026-09-21: 에셋 430.1, 크롬 400 은 406.6,
 * 500 은 480.7 — 같은 방식으로 잰 `MenuItem` 은 500 에 붙는다). 이 저장소의 다른 컨트롤이
 * 대부분 `font-medium` 이라 빠뜨리면 상속으로 굵어지므로 명시한다.
 *
 * `<button>` 이다. 칩은 눌러서 고르는 것이고, 그래야 `disabled` 가 모양뿐 아니라 실제로 조작을
 * 막는다. 링크로 쓸 자리가 생기면 그때 `Button` 처럼 `asChild` 를 더한다.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, tone = 'gray', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex h-9 items-center rounded-full border px-4 text-sm font-normal',
        'transition-colors disabled:cursor-not-allowed',
        TONE_CLASSES[tone],
        /* 비활성은 톤을 덮어쓴다. 어느 톤에서 꺼졌는지는 보는 사람에게 뜻이 없다. */
        'disabled:border-gray-200 disabled:bg-white disabled:text-gray-400',
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = 'Chip';
