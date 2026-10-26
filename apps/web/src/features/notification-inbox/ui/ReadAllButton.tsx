'use client';

import { cn } from '@ogonggo/ui';
import { useReadAll, useUnreadCount } from '../model/useNotifications';

/**
 * 알림함 머리 오른쪽의 `모두 읽음`. 미읽음이 없거나(모르는 동안 포함) 요청 중이면 누를 수 없다.
 * 크기는 쓰는 쪽이 정한다 — 패널은 13px, 화면은 14px 에 44px 높이다(시안).
 */
export function ReadAllButton({ className }: { className?: string }) {
  const count = useUnreadCount();
  const readAll = useReadAll();
  return (
    <button
      type="button"
      disabled={!count || readAll.isPending}
      onClick={() => readAll.mutate()}
      className={cn(
        'px-1 font-medium text-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:text-gray-400',
        className,
      )}
    >
      모두 읽음
    </button>
  );
}
