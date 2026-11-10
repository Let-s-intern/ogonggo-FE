import type { Metadata } from 'next';
import { MyAdContracts } from '@/widgets/my-ad-contracts/MyAdContracts';
import { parsePage } from '@/widgets/my-ad-contracts/model';

export const metadata: Metadata = { title: '광고 신청 내역' };

/** 내 광고 신청 목록. 페이지가 주소에 있다(`?page=`). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <MyAdContracts page={parsePage((await searchParams).page)} />;
}
