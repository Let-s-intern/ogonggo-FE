import type { Metadata } from 'next';
import { AdvertisementContractsPage } from '@/views/mypage';

export const metadata: Metadata = { title: '광고 리포트' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const requestedPage = Number(rawPage ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  return <AdvertisementContractsPage page={page} />;
}
