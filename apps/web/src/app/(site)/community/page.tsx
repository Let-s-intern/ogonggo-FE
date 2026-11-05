import type { Metadata } from 'next';
import { CommunityPage } from '@/views/community';

export const metadata: Metadata = {
  title: '오공고 커뮤니티',
  description:
    '직무별 채용공고 큐레이션 오픈채팅방과 렛츠커리어·오공고 인스타그램에서 취준 정보를 함께 나눠요.',
  alternates: { canonical: '/community' },
};

export default function Page() {
  return <CommunityPage />;
}
