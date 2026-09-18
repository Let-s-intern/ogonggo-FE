import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

export type SpeechBubbleProps = HTMLAttributes<HTMLDivElement>;

/**
 * 아래를 가리키는 짧은 말풍선. 어떤 버튼 위에 붙어 그 버튼을 가리킨다(`로그인.png` 의 "최근 로그인").
 *
 * 자리는 쓰는 쪽이 잡는다. 보통 가리킬 요소를 `relative` 로 감싸고 이 말풍선을 `absolute bottom-full` 로 둔다.
 * 꼬리는 가운데에 있다.
 *
 * 마우스를 올려야 뜨는 툴팁이 아니라 늘 떠 있는 표시라 `role="tooltip"` 을 쓰지 않는다. 가리키는 버튼에
 * 설명으로 읽히게 하려면 버튼의 `aria-describedby` 에 이 요소의 `id` 를 넘긴다.
 */
export const SpeechBubble = forwardRef<HTMLDivElement, SpeechBubbleProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative w-max rounded-xs bg-gray-800 px-2 py-1 text-sm font-medium text-white',
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-gray-800"
      />
    </div>
  ),
);
SpeechBubble.displayName = 'SpeechBubble';
