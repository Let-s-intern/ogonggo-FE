import type { Metadata } from 'next';
import { CareerSignUpPage } from '@/views/signup';

export const metadata: Metadata = { title: '커리어 정보 입력' };

export default function Page() {
  return <CareerSignUpPage />;
}
