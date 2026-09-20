import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

const TONE_CLASSES = {
  /* 글자는 `blue-500`(#4A76FF) 이다. 목업(`docs/image-3.png`) 과 맞춘 값으로, 배경은 원래 맞았다. */
  main: 'bg-blue-50 text-blue-500',
  /*
   * 목업은 `emerald-50`(#ECFDF5) 바탕에 `emerald-700` 이다. 지금까지 쓰던
   * `green-50`(#F0FDF4) / `--color-success`(#10B981) 보다 글자 대비가 크다.
   *
   * 배경은 목업과 정확히 같고(#ECFDF5), 글자는 브라우저가 #007A55 로 그린다. 목업에 적힌
   * #047857 은 Tailwind v3 의 emerald-700 이고 v4 는 같은 이름을 oklch 로 다시 썼다. 채널당
   * 차이가 2 안쪽이라 `urgent`·`danger` 와 같이 팔레트 이름 쪽을 쓴다 — 여기만 hex 를 박으면
   * 아래 주석이 말하는 "색 출처가 갈린다" 가 그대로 일어난다.
   *
   * 토큰으로 옮기지 않는다. `tokens.css` 에 초록 스케일이 없어 여기 값은 Tailwind 기본
   * 팔레트인데, `urgent`·`danger` 도 같은 처지라 이 톤만 토큰화하면 한 컴포넌트 안에서 색
   * 출처가 갈린다.
   */
  success: 'bg-emerald-50 text-emerald-700',
  urgent: 'bg-orange-50 text-orange-600',
  /* 제재·숨김처럼 되돌려야 할 상태. urgent(주황)와 달리 "잘못됨"을 뜻한다. */
  danger: 'bg-red-50 text-red-600',
  neutral: 'bg-gray-100 text-gray-600',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof TONE_CLASSES;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = 'neutral', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-1 text-sm font-medium',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';
