import type { Metadata } from 'next';
import { CompanyProfile } from '@/widgets/company-profile';

export const metadata: Metadata = { title: '기업/기관 정보' };

export default function Page() {
  return <CompanyProfile />;
}
