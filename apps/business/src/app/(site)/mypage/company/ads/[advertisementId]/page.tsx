import type { Metadata } from 'next';
import { MyAdDetail } from '@/widgets/my-ad-detail';

export const metadata: Metadata = { title: '광고 상세' };

/** 기업 마이페이지 광고 상세(시안 B-05). 숫자가 아닌 id 는 조회가 404 로 실패해 오류 문구로 떨어진다. */
export default async function Page({ params }: { params: Promise<{ advertisementId: string }> }) {
  const { advertisementId } = await params;
  return <MyAdDetail id={Number(advertisementId)} />;
}
