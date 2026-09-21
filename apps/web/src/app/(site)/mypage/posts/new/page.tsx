import type { Metadata } from 'next';
import { MyPostFormPage } from '@/views/mypage';

export const metadata: Metadata = { title: '모집글 작성' };

export default function Page() {
  return <MyPostFormPage />;
}
