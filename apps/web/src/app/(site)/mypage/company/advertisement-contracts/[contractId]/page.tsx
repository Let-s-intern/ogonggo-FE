import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdvertisementContractReportPage } from '@/views/mypage';

export const metadata: Metadata = { title: '광고 성과 리포트' };

export default async function Page({ params }: { params: Promise<{ contractId: string }> }) {
  const { contractId: rawContractId } = await params;
  const contractId = Number(rawContractId);
  if (!Number.isSafeInteger(contractId) || contractId <= 0) notFound();

  return <AdvertisementContractReportPage contractId={contractId} />;
}
