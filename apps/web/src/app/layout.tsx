import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppProviders } from './providers';
import './globals.css';

/**
 * 파비콘·앱 아이콘은 파일 규칙이 잡는다 — `app/icon.svg`, `app/apple-icon.png`,
 * `app/manifest.ts`. 여기에 `icons`를 다시 적지 않는다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md).
 *
 * `title.template`은 하위 화면이 자기 제목만 넘기면 뒤에 서비스명이 붙게 한다.
 */
export const metadata: Metadata = {
  title: {
    default: '오늘의 공고',
    template: '%s | 오늘의 공고',
  },
  description: '커리어 여정에 딱 맞는 채용공고, 교육·부트캠프, 사이드·스터디를 모아 봅니다.',
  applicationName: '오늘의 공고',
  openGraph: {
    type: 'website',
    siteName: '오늘의 공고',
    title: '오늘의 공고',
    description: '커리어 여정에 딱 맞는 채용공고, 교육·부트캠프, 사이드·스터디를 모아 봅니다.',
    locale: 'ko_KR',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/*
          헤더·푸터는 여기가 아니라 `(site)/layout.tsx`가 단다. 소개 페이지(`/about`)는 그
          그룹 밖이라 껍데기 없이 렌더된다.
        */}
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
