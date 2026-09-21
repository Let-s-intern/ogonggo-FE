import type { Metadata } from 'next';
import { MyProfilePage } from '@/views/mypage';

export const metadata: Metadata = { title: '개인 정보' };

export default function Page() {
  return <MyProfilePage />;
}
