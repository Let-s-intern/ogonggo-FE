import { BootcampListPage } from '@/views/bootcamp-list';
import { parseBootcampListQuery } from '@/widgets/bootcamp-list';

interface BootcampSearchParams {
  page?: string;
  sort?: string;
  tab?: string;
  openOnly?: string;
}

/**
 * 이 Next 버전에서 `searchParams`는 Promise로 온다 — 홈(`app/page.tsx`)과 같다. 값 검증은
 * `parseBootcampListQuery`가 한 곳에서 맡는다(`widgets/bootcamp-list/lib/query.ts`).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<BootcampSearchParams>;
}) {
  const query = parseBootcampListQuery(await searchParams);

  return <BootcampListPage {...query} />;
}
