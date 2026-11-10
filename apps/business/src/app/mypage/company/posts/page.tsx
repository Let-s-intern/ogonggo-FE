import { redirect } from 'next/navigation';
import { buildCompanyPostsHref, legacyCompanyPostTab } from '@/widgets/company-posts';

/**
 * 기업 회원 화면 왼쪽 메뉴의 공고 목록이 오는 주소. 종류별 목록으로 보내고, `?tab=bootcamps` 면 부트캠프 목록이다
 * (`apps/web/src/app/(site)/mypage/company/posts/page.tsx` 와 같다). 이 Next 버전에서 `searchParams` 는 Promise 로 온다.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  redirect(buildCompanyPostsHref({ tab: legacyCompanyPostTab(await searchParams), page: 1 }));
}
