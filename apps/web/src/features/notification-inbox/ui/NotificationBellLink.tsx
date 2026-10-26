'use client';

import Link from 'next/link';
import { BellIcon } from '@/shared/ui/icons';
import { useUnreadCount } from '../model/useNotifications';
import { UnreadBadge, bellLabel } from './UnreadBadge';

/**
 * 모바일 헤더 윗줄의 알림 아이콘. 누르면 알림함 화면(`/notifications`)으로 간다. 로그인했을 때만 그린다 — 그
 * 판단은 쓰는 쪽(`widgets/site-header`)이 한다.
 */
export function NotificationBellLink({ active }: { active: boolean }) {
  const count = useUnreadCount();
  return (
    <Link
      href="/notifications"
      aria-label={bellLabel(count)}
      aria-current={active ? 'page' : undefined}
      className="relative p-1 text-gray-900"
    >
      <BellIcon className="h-6 w-6" />
      <UnreadBadge count={count} className="-top-0.5 -right-1.5" />
    </Link>
  );
}
