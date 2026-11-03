import type { Metadata } from 'next';
import { SchedulePage } from '@/views/schedule';

export const metadata: Metadata = { title: '신청 가능 일정' };

export default function Page() {
  return <SchedulePage />;
}
