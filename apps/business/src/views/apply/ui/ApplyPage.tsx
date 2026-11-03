import { AdApplicationForm, type AdApplicationPrefill } from '@/widgets/ad-application-form';

/** 광고 신청 화면(시안 B-04). 비회원·기업회원이 같은 화면을 쓴다. */
export function ApplyPage({ prefill }: { prefill: AdApplicationPrefill }) {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 md:py-14">
      <AdApplicationForm prefill={prefill} />
    </main>
  );
}
