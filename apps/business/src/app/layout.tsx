import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { AppProviders } from './providers';
import './globals.css';

/* 프리텐다드 가변 폰트. web 과 같은 파일·같은 변수 이름이다(`apps/web/src/app/layout.tsx` 주석). */
const pretendard = localFont({
  src: '../../../../packages/ui/src/styles/fonts/PretendardVariable.woff2',
  weight: '45 920',
  style: 'normal',
  display: 'swap',
  preload: true,
  variable: '--font-pretendard',
});

export const metadata: Metadata = {
  title: {
    default: '오늘의 공고 비즈니스',
    template: '%s | 오늘의 공고 비즈니스',
  },
  description: '오늘의 공고 지면 광고와 기업 공고 관리.',
  applicationName: '오늘의 공고 비즈니스',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
