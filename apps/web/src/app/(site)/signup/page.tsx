import type { Metadata } from 'next';
import { UserSignUpPage } from '@/views/signup';

export const metadata: Metadata = { title: '회원가입' };

export default function Page() {
  return <UserSignUpPage />;
}
