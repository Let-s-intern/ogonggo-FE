import type { Metadata } from 'next';

export const metadata: Metadata = { title: '스크랩한 공고' };

/**
 * 제목만 있는 자리. 본문은 Push 2 (PRD 2 절) 이 채운다 — Push 1 은 사이드바와 라우트까지다.
 * 네 화면이 다 있어야 메뉴를 눌러 옮겨 다닐 수 있다.
 */
export default function Page() {
  return <h1 className="text-3xl font-bold text-gray-950">스크랩한 공고</h1>;
}
