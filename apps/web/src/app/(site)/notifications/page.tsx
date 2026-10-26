import type { Metadata } from 'next';
import { NotificationsPage } from '@/views/notifications';

/** 로그인한 회원 각자의 목록이라 검색에 내보내지 않는다. */
export const metadata: Metadata = { title: '알림', robots: { index: false } };

export default function Page() {
  return <NotificationsPage />;
}
