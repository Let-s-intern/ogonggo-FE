import type { Metadata } from 'next';
import { CompanyProfilePage } from '@/views/mypage';

export const metadata: Metadata = { title: '기업 정보' };

export default function Page() {
  return <CompanyProfilePage />;
}
