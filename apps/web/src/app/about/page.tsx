import type { Metadata } from 'next';
import { AboutPage } from '@/views/about';

/**
 * 지금은 검색에 걸리지 않게 막아 둔다.
 *
 * 런칭 전 티저라 내용이 통째로 바뀔 예정이고, 이미 색인된 페이지를 내리는 건 재크롤링을
 * 기다려야 해서 몇 주가 걸린다. 반대로 여는 건 아래 `robots` 한 줄을 지우면 끝이다. 비용이
 * 한쪽으로 기울어 있어 닫고 시작한다.
 *
 * 런칭 시점에 색인을 열기로 하면 `robots`를 지우고 `openGraph`에 이 페이지용 제목·설명을
 * 넣는다(루트 레이아웃의 기본값이 서비스 전체 설명이라 소개 페이지 공유 카드로는 맞지 않는다).
 */
export const metadata: Metadata = {
  title: '서비스 소개',
  description: '흩어진 채용공고와 교육 과정, 사이드 프로젝트를 한 자리에 모으고 있습니다.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AboutPage />;
}
