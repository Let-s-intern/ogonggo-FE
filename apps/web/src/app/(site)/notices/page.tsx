import type { Metadata } from 'next';
import { NoticeHomePage } from '@/views/notice-home';

export const metadata: Metadata = { title: '공지사항', alternates: { canonical: '/notices' } };

/** 검색어 `?keyword=`. 앞뒤 공백만 지운다. 비면 검색하지 않는다. */
function parseKeyword(value?: string): string | undefined {
  const keyword = value?.trim();
  return keyword ? keyword : undefined;
}

/** 이 Next 버전에서 `searchParams` 는 Promise 로 온다 — `/side-studies` 와 같다. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string }>;
}) {
  const { keyword } = await searchParams;

  return <NoticeHomePage keyword={parseKeyword(keyword)} />;
}
