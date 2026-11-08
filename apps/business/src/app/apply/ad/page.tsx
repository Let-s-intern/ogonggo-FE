import type { Metadata } from 'next';
import { AdApplicationForm } from '@/widgets/ad-application/AdApplicationForm';

/** 입력 절차라 검색에 싣지 않는다(`app/robots.ts` 도 막는다). */
export const metadata: Metadata = {
  title: '광고 신청',
  alternates: { canonical: '/apply/ad' },
  robots: { index: false, follow: true },
};

export default function AdApplicationPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-14">
      <AdApplicationForm />
    </div>
  );
}
