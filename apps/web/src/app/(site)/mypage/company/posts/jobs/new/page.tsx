import type { Metadata } from 'next';
import { CompanyJobFormPage } from '@/views/mypage';

export const metadata: Metadata = { title: '채용 공고 등록' };

export default function Page() {
  return <CompanyJobFormPage />;
}
