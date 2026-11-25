import type { Metadata } from 'next';
import { MyReportsPage } from '@/views/mypage';

export const metadata: Metadata = { title: '내 리포트' };

export default function Page() {
  return <MyReportsPage />;
}
