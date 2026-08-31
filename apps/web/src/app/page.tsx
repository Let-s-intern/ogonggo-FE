import { GetJobsSort } from '@ogonggo/api';
import { HomePage } from '@/views/home';

interface HomeSearchParams {
  page?: string;
  sort?: string;
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function parseSort(value: string | undefined): GetJobsSort {
  return value === GetJobsSort.VIEW_COUNT ? GetJobsSort.VIEW_COUNT : GetJobsSort.LATEST;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const { page, sort } = await searchParams;

  return <HomePage page={parsePage(page)} sort={parseSort(sort)} />;
}
