import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MyAdContractDetail } from '@/widgets/my-ad-contracts/MyAdContractDetail';

export const metadata: Metadata = { title: '광고 신청 상세' };

export default async function Page({ params }: { params: Promise<{ contractId: string }> }) {
  const contractId = Number((await params).contractId);
  if (!Number.isInteger(contractId) || contractId < 1) notFound();
  return <MyAdContractDetail contractId={contractId} />;
}
