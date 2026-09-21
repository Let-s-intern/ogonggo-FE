import type { Metadata } from 'next';
import { CompanyBootcampFormPage } from '@/views/mypage';

export const metadata: Metadata = { title: '교육 · 부트캠프 공고 등록' };

export default function Page() {
  return <CompanyBootcampFormPage />;
}
