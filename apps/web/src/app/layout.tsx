import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/widgets/site-header';
import { AppProviders } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: '오공고',
  description: '오공고 채용 정보 서비스',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>
          <SiteHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
