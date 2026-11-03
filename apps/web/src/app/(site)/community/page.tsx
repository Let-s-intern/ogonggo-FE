import type { Metadata } from 'next';
import { CommunityPage } from '@/views/community';

export const metadata: Metadata = {
  title: '오공고 커뮤니티',
  description:
    '렛츠커리어가 운영하는 직무별 채용공고 큐레이션 톡방과 인스타그램을 한곳에서 만나보세요.',
  alternates: { canonical: '/community' },
};

export default function Page() {
  return <CommunityPage />;
}
