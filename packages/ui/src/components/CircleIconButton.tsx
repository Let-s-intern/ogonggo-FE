import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

export interface CircleIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 글자 없이 아이콘만 있으므로 스크린 리더가 읽을 이름이 필요하다. `aria-label` 로 나간다. */
  label: string;
}

/**
 * 아이콘 하나만 든 원형 버튼(`로그인.png` 의 간편 로그인). 배경색은 쓰는 쪽이 `className` 으로 준다 —
 * 카카오 노랑·네이버 초록 같은 브랜드 색은 디자인 토큰이 아니라 그 서비스의 것이다.
 */
export const CircleIconButton = forwardRef<HTMLButtonElement, CircleIconButtonProps>(
  ({ className, label, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-gray-100 transition',
        'hover:brightness-95 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
CircleIconButton.displayName = 'CircleIconButton';
