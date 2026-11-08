import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CompanyMyPageLayout } from '@/widgets/company-mypage/ui/CompanyMyPageLayout';

/** 계정 화면이라 검색에 싣지 않는다(`app/robots.ts` 도 `/mypage` 를 막는다). 아래 화면이 모두 물려받는다. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <CompanyMyPageLayout>{children}</CompanyMyPageLayout>;
}
