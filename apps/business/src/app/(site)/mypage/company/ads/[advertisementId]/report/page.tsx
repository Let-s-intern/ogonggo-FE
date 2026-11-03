import type { Metadata } from 'next';
import { MyAdReport } from '@/widgets/my-ad-report';

export const metadata: Metadata = { title: '성과 리포트' };

/** 기업 마이페이지 광고 성과 리포트(시안 B-06). 종료된 광고만 있다. */
export default async function Page({ params }: { params: Promise<{ advertisementId: string }> }) {
  const { advertisementId } = await params;
  return <MyAdReport id={Number(advertisementId)} />;
}
