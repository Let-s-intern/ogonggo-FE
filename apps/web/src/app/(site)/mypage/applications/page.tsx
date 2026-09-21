import type { Metadata } from 'next';
import { MyApplicationsPage } from '@/views/mypage';
import { parseMyApplicationsQuery } from '@/widgets/my-applications';

export const metadata: Metadata = { title: '지원·신청 내역' };

/**
 * 탭·필터·페이지가 전부 주소에 있다. 이 Next 버전에서 `searchParams` 는 Promise 로 온다 —
 * 스크랩 화면(`app/(site)/mypage/scraps/page.tsx`) 과 같다.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <MyApplicationsPage {...parseMyApplicationsQuery(await searchParams)} />;
}
