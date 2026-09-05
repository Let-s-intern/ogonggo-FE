import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './landing.css';

/**
 * 이 앱은 `apps/web` 과 레이아웃을 공유하지 않는다. 헤더·푸터도 스타일도 자기 것만 쓴다 —
 * 런칭 이후 이 폴더를 통째로 지울 수 있어야 하고, 공유하는 껍데기가 하나라도 생기면 지우는
 * 순간 다른 앱이 깨진다.
 */
export const metadata: Metadata = {
  title: '오늘의 공고 — 채용 담당자 출시 알림 신청 | 렛츠커리어',
  description:
    '9월 23일 런칭하는 렛츠커리어 ‘오늘의 공고’ 출시 알림을 신청하면 인스타그램 또는 오픈채팅방에 채용공고를 1회 무료로 홍보해드립니다.',
  openGraph: {
    type: 'website',
    siteName: '오늘의 공고',
    title: '렛츠커리어 ‘오늘의 공고’ 무료 홍보 혜택',
    description: '출시 알림을 신청하면 기업별 1회 채용공고 무료 홍보를 진행해드립니다.',
    locale: 'ko_KR',
  },
  // 런칭 전 임시 페이지다. 검색 결과에 남아 런칭 뒤에도 떠 있으면 곤란하다.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/*
          Pretendard 는 에셋이 쓰던 그대로 CDN 에서 받는다. 워크스페이스 폰트 설정을 끌어오면
          `packages/` 에 묶이고, 그러면 이 앱을 지울 때 확인할 것이 하나 더 생긴다.
        */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
