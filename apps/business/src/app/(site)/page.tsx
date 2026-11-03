import type { Metadata } from 'next';
import { LandingPage } from '@/views/landing';

export const metadata: Metadata = { title: { absolute: '오늘의 공고 FOR BUSINESS' } };

export default function Page() {
  return <LandingPage />;
}
