import type { Metadata } from 'next';

export const metadata: Metadata = { title: '작성한 공고' };

/**
 * 본문은 Push 2 가 채운다(v5 PRD 2 절). 지금은 사이드바 메뉴가 가리킬 곳만 있다 —
 * 첫 메뉴가 없으면 `/mypage/company` 와 역할 가드가 보낼 곳이 없다.
 */
export default function Page() {
  return <h1 className="text-3xl font-bold text-gray-950">작성한 공고</h1>;
}
