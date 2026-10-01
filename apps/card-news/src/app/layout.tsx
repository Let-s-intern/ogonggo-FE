import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import './globals.css';

const pretendard = localFont({
  src: '../../../../packages/ui/src/styles/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '45 920',
});

export const metadata: Metadata = {
  title: '오공고 카드뉴스',
  description: '공고로 인스타그램 카드뉴스를 만듭니다.',
  // 운영 도구다. 검색에 걸리지 않게 한다.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="font-sans text-gray-900">{children}</body>
    </html>
  );
}
