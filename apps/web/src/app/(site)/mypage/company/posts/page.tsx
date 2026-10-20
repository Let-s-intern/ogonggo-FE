import { redirect } from 'next/navigation';
import { buildCompanyPostsHref, legacyCompanyPostTab } from '@/widgets/company-posts';

/**
 * 메뉴가 `채용공고` · `부트캠프` 로 나뉘기 전의 목록 주소. `?tab=` 을 읽어 새 경로로 보낸다
 * (`prd-company-mypage-posts.md`). 이 Next 버전에서 `searchParams` 는 Promise 로 온다.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  redirect(buildCompanyPostsHref({ tab: legacyCompanyPostTab(await searchParams), page: 1 }));
}
