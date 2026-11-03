import type { Metadata } from 'next';
import { CompanyPostsPage } from '@/views/mypage';
import { parseCompanyPostsQuery } from '@/widgets/company-posts';

export const metadata: Metadata = { title: '부트캠프' };

/** 기업 회원의 부트캠프 목록. 페이지가 주소에 있다(`widgets/company-posts/lib/query.ts`). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <CompanyPostsPage {...parseCompanyPostsQuery('bootcamps', await searchParams)} />;
}
