import type { Metadata } from 'next';
import { MyScrapsPage } from '@/views/mypage';
import { parseMyScrapsQuery } from '@/widgets/my-scraps';

export const metadata: Metadata = { title: '스크랩한 공고' };

/**
 * 탭·필터·페이지가 전부 주소에 있다. 이 Next 버전에서 `searchParams` 는 Promise 로 온다 —
 * 부트캠프 목록(`app/(site)/bootcamps/page.tsx`) 과 같다.
 *
 * 값 검증은 `parseMyScrapsQuery` 한 곳이 맡는다. 목록을 읽는 것은 로그인 토큰이 필요해
 * 브라우저에서만 되므로, 서버는 주소를 읽어 넘기는 데까지만 한다.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <MyScrapsPage {...parseMyScrapsQuery(await searchParams)} />;
}
