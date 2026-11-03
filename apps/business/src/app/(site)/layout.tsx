import type { ReactNode } from 'react';
import { BusinessFooter } from '@/widgets/business-footer';
import { BusinessHeader } from '@/widgets/business-header';

/** 비즈니스 화면들의 껍데기. 헤더와 푸터가 여기 붙는다. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BusinessHeader />
      {children}
      <BusinessFooter />
    </>
  );
}
