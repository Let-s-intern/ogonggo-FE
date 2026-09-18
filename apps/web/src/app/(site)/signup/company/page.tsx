import type { Metadata } from 'next';
import { CompanySignUpPage } from '@/views/signup';

export const metadata: Metadata = { title: '기업 회원가입' };

export default function Page() {
  return <CompanySignUpPage />;
}
