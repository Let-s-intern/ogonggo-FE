import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import {
  IS_INDEXABLE_DEPLOYMENT,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
} from '@/shared/config/site';
import { AppProviders } from './providers';
import './globals.css';

/** `apps/web/src/app/layout.tsx` 와 같은 폰트 파일이다. `variable` 은 `tokens.css` 의 `--font-sans` 가 부른다. */
const pretendard = localFont({
  src: '../../../../packages/ui/src/styles/fonts/PretendardVariable.woff2',
  weight: '45 920',
  style: 'normal',
  display: 'swap',
  preload: true,
  variable: '--font-pretendard',
});

/**
 * canonical 은 화면마다 낸다. 루트에 두면 자기 값을 안 내는 화면이 모두 같은 주소를 주장한다.
 * 운영이 아닌 배포본(프리뷰·로컬)은 `noindex` 로 막는다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: `${SITE_NAME} | 채용공고·교육 모집 광고`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    '채용공고 광고',
    '채용 광고',
    '인턴 채용 광고',
    '신입 채용 홍보',
    '부트캠프 광고',
    '교육 모집 광고',
    '취준생 타겟 광고',
    '오늘의 공고',
    '렛츠커리어',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 채용공고·교육 모집 광고`,
    description: SITE_DESCRIPTION,
    locale: 'ko_KR',
  },
  twitter: { card: 'summary_large_image' },
  robots: IS_INDEXABLE_DEPLOYMENT ? undefined : { index: false, follow: false },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NAVER_SITE_VERIFICATION
      ? { 'naver-site-verification': process.env.NAVER_SITE_VERIFICATION }
      : undefined,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        {/* 헤더·푸터는 공개 화면(`(site)/layout.tsx`)만 단다. 기업 회원 화면은 콘솔 틀이다(`mypage/company/layout.tsx`). */}
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
