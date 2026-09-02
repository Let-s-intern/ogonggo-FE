import { SideStudyListPage } from '@/views/side-study-list';
import { parseSideStudyListQuery } from '@/widgets/side-study-list';

interface SideStudySearchParams {
  page?: string;
  tab?: string;
}

/**
 * 이 Next 버전에서 `searchParams`는 Promise로 온다 — `/bootcamps`와 같다. 값 검증은
 * `parseSideStudyListQuery`가 한 곳에서 맡는다(`widgets/side-study-list/lib/query.ts`).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SideStudySearchParams>;
}) {
  const query = parseSideStudyListQuery(await searchParams);

  return <SideStudyListPage {...query} />;
}
