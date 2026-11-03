import type { Metadata } from 'next';
import { MyAds, parseMyAdsQuery } from '@/widgets/my-ads';

export const metadata: Metadata = { title: '광고' };

/** 기업 마이페이지 광고 목록. 탭·쪽은 주소에 있다(`widgets/my-ads/lib/query.ts`). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <MyAds query={parseMyAdsQuery(await searchParams)} />;
}
