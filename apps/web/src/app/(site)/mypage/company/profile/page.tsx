import type { Metadata } from 'next';

export const metadata: Metadata = { title: '기업/기관 정보' };

/** 본문은 이 Push 의 2.0 이 채운다(v5 PRD 5 절). 지금은 메뉴가 가리킬 곳만 있다. */
export default function Page() {
  return <h1 className="text-3xl font-bold text-gray-950">기업/기관 정보</h1>;
}
