import { HomePage } from '@/views/home';

interface HomeSearchParams {
  page?: string;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const { page } = await searchParams;

  return <HomePage page={parsePage(page)} />;
}
