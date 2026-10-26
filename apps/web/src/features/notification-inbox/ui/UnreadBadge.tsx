import { cn } from '@ogonggo/ui';

/** 배지에 쓰는 글자. 100 이상은 `99+` 다. 서버는 실제 개수를 준다. */
export function unreadBadgeText(count: number): string {
  return count > 99 ? '99+' : String(count);
}

/** 알림 아이콘의 접근성 이름. 미읽음이 있으면 실제 개수를 읽어 준다. */
export function bellLabel(count: number | undefined): string {
  return count ? `알림, 읽지 않은 알림 ${count}개` : '알림';
}

/**
 * 알림 아이콘 오른쪽 위의 빨간 숫자. 0 이거나 아직 모르면 그리지 않는다. 숫자는 아이콘의 접근성 이름(`bellLabel`)이
 * 이미 읽으므로 스크린 리더에는 숨긴다. 흰 테두리는 아이콘 선과 겹칠 때 숫자를 떼어 보이게 한다(시안).
 */
export function UnreadBadge({ count, className }: { count?: number; className?: string }) {
  if (!count) {
    return null;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute h-[18px] min-w-[18px] rounded-full border-2 border-white bg-error px-[5px] text-center text-[11px] leading-[14px] font-bold text-white',
        className,
      )}
    >
      {unreadBadgeText(count)}
    </span>
  );
}
